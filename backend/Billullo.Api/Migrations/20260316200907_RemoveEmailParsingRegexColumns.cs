using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Billullo.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEmailParsingRegexColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AmountRegex",
                table: "EmailParsingRules");

            migrationBuilder.DropColumn(
                name: "CurrencyRegex",
                table: "EmailParsingRules");

            migrationBuilder.DropColumn(
                name: "DateFormat",
                table: "EmailParsingRules");

            migrationBuilder.DropColumn(
                name: "DateRegex",
                table: "EmailParsingRules");

            migrationBuilder.DropColumn(
                name: "DescriptionRegex",
                table: "EmailParsingRules");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AmountRegex",
                table: "EmailParsingRules",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CurrencyRegex",
                table: "EmailParsingRules",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DateFormat",
                table: "EmailParsingRules",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DateRegex",
                table: "EmailParsingRules",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DescriptionRegex",
                table: "EmailParsingRules",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }
    }
}
