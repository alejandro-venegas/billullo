import { observer } from "mobx-react-lite";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import RuleIcon from "@mui/icons-material/AutoFixHigh";
import type { CategoryDto, CategoryRuleDto } from "@/api/data-contracts";

export interface CategoryTreeActions {
  getChildren: (parentId: number | string) => CategoryDto[];
  getRules: (categoryId: number | string) => CategoryRuleDto[];
  onAddSubcategory: (parentId: number | string) => void;
  onEditCategory: (cat: CategoryDto) => void;
  onDeleteCategory: (id: number | string) => void;
  onCreateRule: (categoryId: number | string) => void;
  onEditRule: (rule: CategoryRuleDto) => void;
  onDeleteRule: (id: number | string) => void;
}

function RulesList({
  categoryId,
  actions,
}: {
  categoryId: number | string;
  actions: CategoryTreeActions;
}) {
  const rules = actions.getRules(categoryId);
  return (
    <>
      {rules.length > 0 && (
        <List dense disablePadding>
          {rules.map((rule) => (
            <ListItem
              key={rule.id}
              secondaryAction={
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Edit rule">
                    <IconButton
                      size="small"
                      onClick={() => actions.onEditRule(rule)}
                      color="primary"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete rule">
                    <IconButton
                      size="small"
                      onClick={() => actions.onDeleteRule(rule.id)}
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
              sx={{ pl: 0 }}
            >
              <ListItemText
                primary={
                  <Chip
                    label={`/${rule.pattern}/i`}
                    size="small"
                    sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}
                  />
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => actions.onCreateRule(categoryId)}
        sx={{ mt: 0.5 }}
      >
        Add Rule
      </Button>
    </>
  );
}

function CategoryActionButtons({
  category,
  actions,
}: {
  category: CategoryDto;
  actions: CategoryTreeActions;
}) {
  return (
    <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
      <Tooltip title="Add subcategory">
        <IconButton
          size="small"
          onClick={() => actions.onAddSubcategory(category.id)}
          color="primary"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit">
        <IconButton
          size="small"
          onClick={() => actions.onEditCategory(category)}
          color="primary"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Delete">
        <IconButton
          size="small"
          onClick={() => actions.onDeleteCategory(category.id)}
          color="error"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

const SubcategoryNode = observer(function SubcategoryNode({
  category,
  actions,
}: {
  category: CategoryDto;
  actions: CategoryTreeActions;
}) {
  const subcategories = actions.getChildren(category.id);
  const ruleCount = actions.getRules(category.id).length;

  return (
    <Accordion
      disableGutters
      elevation={0}
      slotProps={{ transition: { unmountOnExit: true } }}
      sx={{ "&:before": { display: "none" }, backgroundColor: "transparent" }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
        sx={{
          minHeight: 36,
          px: 1,
          "& .MuiAccordionSummary-content": { my: 0.5 },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", pr: 0.5 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2">{category.name}</Typography>
            {ruleCount > 0 && (
              <Chip
                icon={<RuleIcon />}
                label={ruleCount}
                size="small"
                variant="outlined"
                color="primary"
                sx={{ height: 20, "& .MuiChip-label": { px: 0.5 } }}
              />
            )}
          </Stack>
          <CategoryActionButtons category={category} actions={actions} />
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0, pl: 3 }}>
        {subcategories.length > 0 && (
          <>
            {subcategories.map((sub) => (
              <SubcategoryNode key={sub.id} category={sub} actions={actions} />
            ))}
            <Divider sx={{ my: 1 }} />
          </>
        )}
        <RulesList categoryId={category.id} actions={actions} />
      </AccordionDetails>
    </Accordion>
  );
});

const CategoryAccordion = observer(function CategoryAccordion({
  category,
  actions,
}: {
  category: CategoryDto;
  actions: CategoryTreeActions;
}) {
  const subcategories = actions.getChildren(category.id);
  const rules = actions.getRules(category.id);

  return (
    <Accordion
      disableGutters
      slotProps={{ transition: { unmountOnExit: true } }}
      sx={{
        mb: 1,
        "&:before": { display: "none" },
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        borderLeft: category.color ? `4px solid ${category.color}` : undefined,
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography fontWeight={500}>{category.name}</Typography>
            {rules.length > 0 && (
              <Chip
                icon={<RuleIcon />}
                label={`${rules.length} rule${rules.length !== 1 ? "s" : ""}`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Stack>
          <CategoryActionButtons category={category} actions={actions} />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ pt: 0 }}>
        {subcategories.length > 0 && (
          <>
            <Divider sx={{ mb: 0.5 }} />
            <Typography
              variant="subtitle2"
              color="text.secondary"
              sx={{ mb: 0.5, px: 1 }}
            >
              Subcategories
            </Typography>
            {subcategories.map((sub) => (
              <SubcategoryNode key={sub.id} category={sub} actions={actions} />
            ))}
          </>
        )}
        <Divider sx={{ my: 1 }} />
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
          Rules
        </Typography>
        <RulesList categoryId={category.id} actions={actions} />
      </AccordionDetails>
    </Accordion>
  );
});

CategoryAccordion.displayName = "CategoryAccordion";

export default CategoryAccordion;
