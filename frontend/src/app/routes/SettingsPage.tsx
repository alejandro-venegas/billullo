import { useState, useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import { useStore } from "@/app/stores/StoreContext";
import type { CategoryDto, CategoryRuleDto } from "@/api/data-contracts";
import CategoryDialog from "@/features/categories/components/CategoryDialog/CategoryDialog";
import RuleDialog from "@/features/categories/components/RuleDialog/RuleDialog";
import CategoryAccordion from "@/features/categories/components/CategoryAccordion/CategoryAccordion";
import type { CategoryTreeActions } from "@/features/categories/components/CategoryAccordion/CategoryAccordion";
import ConfirmDialog from "@/shared/components/ConfirmDialog/ConfirmDialog";
import EmailConfigSection from "@/features/email/components/EmailConfigSection/EmailConfigSection";
import EmailParsingRulesSection from "@/features/email/components/EmailParsingRulesSection/EmailParsingRulesSection";
import { CURRENCIES } from "@/shared/constants";
import { useConfirmDelete } from "@/shared/hooks/useConfirmDelete";

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
      {value === index && children}
    </Box>
  );
}

const SettingsPage = observer(() => {
  const { categoryStore, ruleStore, preferenceStore } = useStore();
  const [tab, setTab] = useState(0);

  // Category dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    CategoryDto | undefined
  >();
  const [dialogParentId, setDialogParentId] = useState<string | undefined>();

  // Rule dialog state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CategoryRuleDto | undefined>();
  const [ruleTargetCategoryId, setRuleTargetCategoryId] = useState<string>("");

  const [deletingCatInUse, setDeletingCatInUse] = useState(false);

  const {
    isOpen: deleteCatDialogOpen,
    requestDelete: requestDeleteCategory,
    handleConfirm: handleDeleteCategoryConfirm,
    handleClose: handleDeleteCatClose,
  } = useConfirmDelete(
    (id) => categoryStore.deleteCategory(id),
    "Failed to delete category",
  );

  const {
    isOpen: deleteRuleDialogOpen,
    requestDelete: handleDeleteRuleClick,
    handleConfirm: handleDeleteRuleConfirm,
    handleClose: handleDeleteRuleClose,
  } = useConfirmDelete(
    (id) => ruleStore.deleteRule(id),
    "Failed to delete rule",
  );

  // --- Category handlers ---
  const handleCreateCategory = useCallback(() => {
    setEditingCategory(undefined);
    setDialogParentId(undefined);
    setCategoryDialogOpen(true);
  }, []);

  const handleAddSubcategory = useCallback((parentId: number | string) => {
    setEditingCategory(undefined);
    setDialogParentId(String(parentId));
    setCategoryDialogOpen(true);
  }, []);

  const handleEditCategory = useCallback((cat: CategoryDto) => {
    setEditingCategory(cat);
    setDialogParentId(undefined);
    setCategoryDialogOpen(true);
  }, []);

  const handleSaveCategory = async (
    name: string,
    parentCategoryId?: string | null,
    color?: string | null,
  ) => {
    if (editingCategory) {
      await categoryStore.updateCategory(editingCategory.id, name, color);
    } else {
      await categoryStore.addCategory(name, parentCategoryId, color);
    }
  };

  const handleDeleteCategoryClick = useCallback((id: number | string) => {
    setDeletingCatInUse(categoryStore.isCategoryInUse(id));
    requestDeleteCategory(id);
  }, [categoryStore, requestDeleteCategory]);

  // --- Rule handlers ---
  const handleCreateRule = useCallback((categoryId: number | string) => {
    setEditingRule(undefined);
    setRuleTargetCategoryId(String(categoryId));
    setRuleDialogOpen(true);
  }, []);

  const handleEditRule = useCallback((rule: CategoryRuleDto) => {
    setEditingRule(rule);
    setRuleTargetCategoryId(String(rule.categoryId));
    setRuleDialogOpen(true);
  }, []);

  const categoryTreeActions: CategoryTreeActions = useMemo(() => ({
    getChildren: (id: number | string) => categoryStore.getChildren(id),
    getRules: (id: number | string) => ruleStore.getRulesForCategory(id),
    onAddSubcategory: handleAddSubcategory,
    onEditCategory: handleEditCategory,
    onDeleteCategory: handleDeleteCategoryClick,
    onCreateRule: handleCreateRule,
    onEditRule: handleEditRule,
    onDeleteRule: handleDeleteRuleClick,
  }), [
    categoryStore, ruleStore,
    handleAddSubcategory, handleEditCategory, handleDeleteCategoryClick,
    handleCreateRule, handleEditRule, handleDeleteRuleClick,
  ]);

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
        Settings
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Preferences" />
        <Tab label="Categories" />
        <Tab label="Email" />
      </Tabs>

      {/* ─── Preferences Tab ─── */}
      <TabPanel value={tab} index={0}>
        <Box sx={{ maxWidth: 400 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Currency
          </Typography>
          <TextField
            select
            fullWidth
            size="small"
            label="Preferred Currency"
            value={preferenceStore.preferredCurrency}
            onChange={(e) =>
              preferenceStore.setPreferredCurrency(e.target.value)
            }
          >
            {CURRENCIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </TabPanel>

      {/* ─── Categories Tab ─── */}
      <TabPanel value={tab} index={1}>
        <Box sx={{ maxWidth: 700 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography variant="h6">Categories &amp; Rules</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateCategory}
              size="small"
            >
              Add Category
            </Button>
          </Stack>

          {categoryStore.rootCategories.map((cat) => (
            <CategoryAccordion
              key={cat.id}
              category={cat}
              actions={categoryTreeActions}
            />
          ))}

          {categoryStore.rootCategories.length === 0 && (
            <Typography color="text.secondary">
              No categories yet. Add one to get started.
            </Typography>
          )}
        </Box>
      </TabPanel>

      {/* ─── Email Tab ─── */}
      <TabPanel value={tab} index={2}>
        <Stack spacing={3}>
          <EmailConfigSection />
          <EmailParsingRulesSection />
        </Stack>
      </TabPanel>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onClose={() => {
          setCategoryDialogOpen(false);
          setEditingCategory(undefined);
          setDialogParentId(undefined);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
        parentCategoryId={dialogParentId}
      />

      <RuleDialog
        open={ruleDialogOpen}
        onClose={() => {
          setRuleDialogOpen(false);
          setEditingRule(undefined);
        }}
        rule={editingRule}
        categoryId={ruleTargetCategoryId}
      />

      <ConfirmDialog
        open={deleteCatDialogOpen}
        onClose={handleDeleteCatClose}
        onConfirm={handleDeleteCategoryConfirm}
        title="Delete Category"
        description="Are you sure you want to delete this category? All subcategories and associated auto-categorization rules will also be deleted."
        warning={
          deletingCatInUse
            ? "This category is currently used by existing transactions. Deleting it will leave those transactions with an unknown category."
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteRuleDialogOpen}
        onClose={handleDeleteRuleClose}
        onConfirm={handleDeleteRuleConfirm}
        title="Delete Rule"
        description="Are you sure you want to delete this auto-categorization rule?"
      />
    </Box>
  );
});

SettingsPage.displayName = "SettingsPage";

export default SettingsPage;
