import html2canvas from "html2canvas";
import { PDFDocument } from "pdf-lib";

type ColorOption = "none" | "green" | "blue" | "amber" | "red" | "purple";

interface PrintCashflowOptions {
  tableRef: HTMLElement;
  title?: string;
  credits: number;
  debits: number;
  balance: number;
  coloredCells?: Record<string, ColorOption>;
  transactions?: Array<{
    id: string;
    amount: number;
    transaction_type: string;
  }>;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
};

const COLOR_LABELS: Record<ColorOption, string> = {
  none: "",
  green: "Verde",
  blue: "Azul",
  amber: "Amarelo",
  red: "Vermelho",
  purple: "Roxo",
};

const COLOR_STYLES: Record<ColorOption, { bg: string; text: string }> = {
  none: { bg: "", text: "" },
  green: { bg: "#d1fae5", text: "#047857" },
  blue: { bg: "#dbeafe", text: "#1d4ed8" },
  amber: { bg: "#fef3c7", text: "#b45309" },
  red: { bg: "#fee2e2", text: "#dc2626" },
  purple: { bg: "#ede9fe", text: "#7c3aed" },
};

/**
 * Generates the HTML for the cashflow print document
 */
function generateCashflowPrintHtml(options: PrintCashflowOptions): string {
  const { title, credits, debits, balance, coloredCells, transactions } = options;
  const today = new Date().toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // Calculate color totals if colored cells exist
  let colorTotalsHtml = "";
  if (coloredCells && transactions && Object.keys(coloredCells).length > 0) {
    const colorTotals: Record<ColorOption, number> = {
      none: 0, green: 0, blue: 0, amber: 0, red: 0, purple: 0
    };

    Object.entries(coloredCells).forEach(([cellId, color]) => {
      const tx = transactions.find((t) => t.id === cellId);
      if (tx && color !== "none") {
        if (tx.transaction_type === "credit") {
          colorTotals[color] += Math.abs(tx.amount);
        } else {
          colorTotals[color] -= Math.abs(tx.amount);
        }
      }
    });

    const activeColors = (Object.keys(colorTotals) as ColorOption[]).filter(
      (c) => c !== "none" && colorTotals[c] !== 0
    );

    const grandTotal = Object.values(colorTotals).reduce((sum, val) => sum + val, 0);

    if (activeColors.length > 0) {
      const colorItems = activeColors
        .map((c) => {
          const style = COLOR_STYLES[c];
          return `<span style="background: ${style.bg}; color: ${style.text}; padding: 2px 8px; border-radius: 4px; margin-right: 8px;">
            ${COLOR_LABELS[c]}: <strong>${formatCurrency(colorTotals[c])}</strong>
          </span>`;
        })
        .join("");

      colorTotalsHtml = `
        <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;">
          <div style="font-size: 10pt; color: #6b7280; margin-bottom: 8px;">Observações</div>
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
            ${colorItems}
            <span style="margin-left: auto; font-weight: bold;">Total: ${formatCurrency(grandTotal)}</span>
          </div>
        </div>
      `;
    }
  }

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title || "Plano Financeiro - Cashflow"}</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    * { box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 9pt;
      color: #333;
      margin: 0;
      padding: 16px;
      background: white;
    }
    .header {
      border-bottom: 2px solid #1a56db;
      padding-bottom: 8px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 16pt;
      font-weight: bold;
      color: #1a56db;
      margin: 0 0 4px 0;
    }
    .date {
      font-size: 8pt;
      color: #6b7280;
    }
    .summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }
    .summary-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .summary-label {
      color: #6b7280;
      font-size: 9pt;
    }
    .summary-value {
      font-weight: 600;
      font-size: 10pt;
    }
    .credit { color: #059669; }
    .debit { color: #dc2626; }
    .balance-positive { color: #059669; }
    .balance-negative { color: #dc2626; }
    .table-container {
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    th {
      background: #f3f4f6;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #d1d5db;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
    }
    tr:nth-child(even) { background: #fafafa; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-semibold { font-weight: 600; }
    tfoot td {
      background: #f3f4f6;
      font-weight: 600;
      border-top: 2px solid #d1d5db;
    }
    /* Colored cells */
    .cell-green { background: #d1fae5 !important; color: #047857 !important; }
    .cell-blue { background: #dbeafe !important; color: #1d4ed8 !important; }
    .cell-amber { background: #fef3c7 !important; color: #b45309 !important; }
    .cell-red { background: #fee2e2 !important; color: #dc2626 !important; }
    .cell-purple { background: #ede9fe !important; color: #7c3aed !important; }
    /* Badge styles */
    .badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 500;
    }
    .badge-credit { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
    .badge-debit { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
    .badge-muted { background: #f3f4f6; color: #6b7280; border: 1px solid #d1d5db; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1 class="title">${title || "Plano Financeiro - Cashflow"}</h1>
    <div class="date">Impresso a ${today}</div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Créditos:</span>
      <span class="summary-value credit">${formatCurrency(credits)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Débitos:</span>
      <span class="summary-value debit">${formatCurrency(debits)}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Saldo:</span>
      <span class="summary-value ${balance >= 0 ? 'balance-positive' : 'balance-negative'}">${formatCurrency(balance)}</span>
    </div>
  </div>
  
  <div class="table-container" id="table-placeholder"></div>
  
  ${colorTotalsHtml}
</body>
</html>`;
}

/**
 * Prints the cashflow table preserving colors
 */
export async function printCashflowTable(options: PrintCashflowOptions): Promise<void> {
  const { tableRef, title, credits, debits, balance, coloredCells, transactions } = options;

  // Create a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    console.error("Popup blocked - could not open print window");
    return;
  }

  // Clone the table to preserve styles
  const tableClone = tableRef.cloneNode(true) as HTMLElement;
  
  // Remove interactive elements (buttons, context menus, etc.)
  tableClone.querySelectorAll("button, [data-radix-collection-item], .opacity-0").forEach((el) => {
    el.remove();
  });

  // Apply inline styles for colors to ensure they print
  if (coloredCells) {
    tableClone.querySelectorAll("tr").forEach((row) => {
      const cells = row.querySelectorAll("td");
      cells.forEach((cell) => {
        // Check for colored spans
        const coloredSpans = cell.querySelectorAll("[class*='bg-emerald'], [class*='bg-blue'], [class*='bg-amber'], [class*='bg-red'], [class*='bg-purple']");
        coloredSpans.forEach((span) => {
          const classList = span.className;
          if (classList.includes("bg-emerald")) {
            (span as HTMLElement).style.backgroundColor = "#d1fae5";
            (span as HTMLElement).style.color = "#047857";
          } else if (classList.includes("bg-blue")) {
            (span as HTMLElement).style.backgroundColor = "#dbeafe";
            (span as HTMLElement).style.color = "#1d4ed8";
          } else if (classList.includes("bg-amber")) {
            (span as HTMLElement).style.backgroundColor = "#fef3c7";
            (span as HTMLElement).style.color = "#b45309";
          } else if (classList.includes("bg-red")) {
            (span as HTMLElement).style.backgroundColor = "#fee2e2";
            (span as HTMLElement).style.color = "#dc2626";
          } else if (classList.includes("bg-purple")) {
            (span as HTMLElement).style.backgroundColor = "#ede9fe";
            (span as HTMLElement).style.color = "#7c3aed";
          }
        });
      });
    });
  }

  // Generate HTML
  const html = generateCashflowPrintHtml({
    tableRef,
    title,
    credits,
    debits,
    balance,
    coloredCells,
    transactions,
  });

  // Write HTML to window
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  // Insert the cloned table
  const placeholder = printWindow.document.getElementById("table-placeholder");
  if (placeholder) {
    placeholder.appendChild(tableClone);
  }

  // Apply print styles to the cloned table
  const style = printWindow.document.createElement("style");
  style.textContent = `
    #table-placeholder table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    #table-placeholder th {
      background: #f3f4f6 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      padding: 6px 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #d1d5db;
    }
    #table-placeholder td {
      padding: 5px 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
    }
    #table-placeholder tr:nth-child(even) { 
      background: #fafafa !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    #table-placeholder tfoot td {
      background: #f3f4f6 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      font-weight: 600;
      border-top: 2px solid #d1d5db;
    }
    /* Ensure text colors print */
    .text-green-600, [class*="text-green"] { color: #059669 !important; -webkit-print-color-adjust: exact !important; }
    .text-red-500, [class*="text-red"] { color: #dc2626 !important; -webkit-print-color-adjust: exact !important; }
    /* Badge styles */
    [class*="bg-green"], [class*="bg-emerald"] { 
      background-color: #dcfce7 !important; 
      color: #166534 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    [class*="bg-red"]:not(.text-red) { 
      background-color: #fee2e2 !important; 
      color: #991b1b !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Hide interactive elements */
    button, [role="button"], .cursor-pointer { display: none !important; }
  `;
  printWindow.document.head.appendChild(style);

  // Wait for content to render
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Trigger print
  printWindow.print();
}
