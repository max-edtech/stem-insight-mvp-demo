const CCI_ENDPOINT =
  "https://www.stat.gov.tw/CCI/CCI_Site/CCIPrice/PartialPriceClassesList.aspx";
const CCI_REFERER =
  "https://www.stat.gov.tw/CCI/CCI_Site/CCIPrice/cciPriceClassesList.aspx";

export interface CciQueryInput {
  categoriesId?: string;
  categoryIds?: string;
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

export interface CciSeriesPoint {
  period: string;
  rocYear: number;
  gregorianYear: number;
  month: number;
  value: number;
  momChangePct: number | null;
  yoyChangePct: number | null;
}

interface CciAjaxResponse {
  PageHtml?: string;
}

function parseRowsFromHtml(html: string) {
  const rows: Array<{ period: string; values: number[] }> = [];
  const rowRegex = /<tr><td>(\d{3}\/\d{2})<\/td>((?:<td>[-\d.]+<\/td>)+)<\/tr>/g;

  let rowMatch: RegExpExecArray | null = rowRegex.exec(html);
  while (rowMatch) {
    const period = rowMatch[1];
    const cellsHtml = rowMatch[2];
    const values: number[] = [];
    const cellRegex = /<td>([-\d.]+)<\/td>/g;
    let cellMatch: RegExpExecArray | null = cellRegex.exec(cellsHtml);
    while (cellMatch) {
      values.push(Number(cellMatch[1]));
      cellMatch = cellRegex.exec(cellsHtml);
    }
    if (values.length > 0) {
      rows.push({ period, values });
    }
    rowMatch = rowRegex.exec(html);
  }

  return rows;
}

function toSortKey(period: string) {
  const [rocYearText, monthText] = period.split("/");
  return Number(rocYearText) * 100 + Number(monthText);
}

export async function fetchCciSeries(input: CciQueryInput): Promise<CciSeriesPoint[]> {
  const payload = {
    cmd: "DwExL",
    data: JSON.stringify({
      CategoriesId: input.categoriesId ?? "",
      CategoryIds: input.categoryIds ?? "",
      CategoryType: "PCLS",
      CorrespondsBYr: input.startYear,
      CorrespondsBMn: input.startMonth,
      CorrespondsEYr: input.endYear,
      CorrespondsEMn: input.endMonth,
    }),
  };

  const response = await fetch(CCI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: CCI_REFERER,
      "User-Agent": "construction-budget-sync",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`CCI request failed: ${response.status}`);
  }

  const data = (await response.json()) as CciAjaxResponse;
  const pageHtml = data.PageHtml ?? "";
  if (!pageHtml) return [];

  const rows = parseRowsFromHtml(pageHtml).sort(
    (a, b) => toSortKey(a.period) - toSortKey(b.period)
  );

  const byPeriod = new Map(rows.map((row) => [row.period, row]));

  return rows.map((row, index) => {
    const [rocYearText, monthText] = row.period.split("/");
    const rocYear = Number(rocYearText);
    const month = Number(monthText);
    const gregorianYear = rocYear + 1911;
    const value = row.values[row.values.length - 1];

    let momChangePct: number | null = null;
    if (index > 0) {
      const prev = rows[index - 1].values[rows[index - 1].values.length - 1];
      if (prev !== 0) {
        momChangePct = ((value / prev) - 1) * 100;
      }
    }

    let yoyChangePct: number | null = null;
    const prevPeriod = `${String(rocYear - 1).padStart(3, "0")}/${String(
      month
    ).padStart(2, "0")}`;
    const prevYoy = byPeriod.get(prevPeriod);
    if (prevYoy) {
      const prevValue = prevYoy.values[prevYoy.values.length - 1];
      if (prevValue !== 0) {
        yoyChangePct = ((value / prevValue) - 1) * 100;
      }
    }

    return {
      period: row.period,
      rocYear,
      gregorianYear,
      month,
      value,
      momChangePct,
      yoyChangePct,
    };
  });
}

export const CCI_SOURCE_URL =
  "https://www.stat.gov.tw/CCI/CCI_Site/index.aspx";

