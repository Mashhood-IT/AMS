import React, { useState, useEffect, useRef, useMemo } from "react";
import Icons from "../../assets/icons";
import DownloadExcel from "./DownloadExcel";

const itemsPerPageOptions = [5, 10, 20, "All"];

const CustomTable = ({
  tableHeaders = [],
  tableData = [],
  exportTableData = null,
  showSearch = true,
  showRefresh = true,
  showDownload = true,
  showPagination = true,
  showSorting = true,
  selectedRow,
  setSelectedRow,
  onRowDoubleClick,
}) => {
  const [search, setSearch] = useState("");
  const [perPage, setPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const tableRef = useRef();
  const persistKey = "customTableColumnOrder";
  const defaultOrder = useMemo(
    () => tableHeaders.map((h) => h.key).filter((key) => key !== "actions"),
    [tableHeaders]
  );

  const [internalOrder, setInternalOrder] = useState(defaultOrder);

  // Load saved order (if any) when component mounts or key changes
  useEffect(() => {
    if (!persistKey) return;
    const saved = localStorage.getItem(persistKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const valid = parsed.filter((k) => defaultOrder.includes(k));
        const missing = defaultOrder.filter((k) => !valid.includes(k));
        setInternalOrder([...valid, ...missing]);
        return;
      } catch { }
    }
    setInternalOrder(defaultOrder);
  }, [persistKey, defaultOrder]);

  useEffect(() => {
    setInternalOrder((prev) => {
      const valid = prev.filter((k) => defaultOrder.includes(k));
      const missing = defaultOrder.filter((k) => !valid.includes(k));
      return [...valid, ...missing];
    });
  }, [defaultOrder]);

  // If parent controls order, use it; else internal
  const order = internalOrder;
  const combinedOrder = [
    ...order,
    ...tableHeaders.map((h) => h.key).filter((key) => key === "actions"),
  ];

  const dragSrcKeyRef = useRef(null);
  const reorder = (arr, srcKey, targetKey) => {
    const next = [...arr];
    const from = next.indexOf(srcKey);
    const to = next.indexOf(targetKey);
    if (from === -1 || to === -1) return arr;
    next.splice(to, 0, next.splice(from, 1)[0]);
    return next;
  };

  const handleDragStart = (key) => (e) => {
    dragSrcKeyRef.current = key;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key); // Firefox needs data set
  };

  const handleDragOver = () => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetKey) => (e) => {
    e.preventDefault();
    const srcKey =
      dragSrcKeyRef.current || e.dataTransfer.getData("text/plain");
    if (!srcKey || srcKey === targetKey) return;

    const newOrder = reorder(order, srcKey, targetKey);
    setInternalOrder(newOrder);

    if (persistKey) {
      localStorage.setItem(persistKey, JSON.stringify(newOrder));
    }
  };

  const headerByKey = (key) => tableHeaders.find((h) => h.key === key);
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => (
    <Icons.ArrowDownUp className="inline w-4 h-4 ml-4 text-slate-400" />
  );

  const filteredData = tableData.filter((item) => {
    const searchLower = search.toLowerCase().trim();
    return Object.values(item).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (showSorting && sortConfig.key) {
      const aVal = a[sortConfig.key] || "";
      const bVal = b[sortConfig.key] || "";
      return sortConfig.direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    }
    return 0;
  });

  const totalPages =
    perPage === "All" ? 1 : Math.ceil(sortedData.length / perPage);
  const paginatedData =
    perPage === "All"
      ? sortedData
      : sortedData.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [filteredData, perPage, page, totalPages]);

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between w-full">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full">
          {showSearch && (
            <div className="relative w-full sm:w-64">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search records..."
                className="border rounded-lg border-slate-200 pl-10 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-brand-active/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
          {showRefresh && (
            <button
              className="border p-2 rounded-lg cursor-pointer border-slate-200 hover:bg-slate-50 transition-colors"
              onClick={() => window.location.reload()}
              title="Reload"
            >
              <Icons.RefreshCcw size={18} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div
        ref={tableRef}
        className="w-full overflow-x-auto rounded-lg border border-slate-200"
      >
        <table className="w-full min-w-[700px] text-sm text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
              {combinedOrder
                .map(headerByKey)
                .filter(Boolean)
                .map((col) => (
                  <th
                    key={col.key}
                    draggable={col.key !== "actions"}
                    onDragStart={
                      col.key !== "actions"
                        ? handleDragStart(col.key)
                        : undefined
                    }
                    onDragOver={
                      col.key !== "actions"
                        ? handleDragOver(col.key)
                        : undefined
                    }
                    onDrop={
                      col.key !== "actions" ? handleDrop(col.key) : undefined
                    }
                    onClick={() =>
                      showSorting && col.key && requestSort(col.key)
                    }
                    className={`px-4 py-4 font-semibold whitespace-nowrap ${showSorting && col.key
                      ? "cursor-pointer hover:bg-slate-100 transition-colors"
                      : ""
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      {showSorting && col.key && getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={combinedOrder.length} className="px-4 py-10 text-center text-slate-400 italic">
                  No records found
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={item._id || rowIdx}
                  onClick={
                    setSelectedRow
                      ? () =>
                        setSelectedRow(
                          selectedRow === item._id ? null : item._id
                        )
                      : undefined
                  }
                  onDoubleClick={() => onRowDoubleClick?.(item)}
                  className={`border-b border-slate-100 last:border-0 hover:bg-blue-50/50 transition-colors ${setSelectedRow ? "cursor-pointer " : ""
                    } ${setSelectedRow && selectedRow === item._id
                      ? "bg-blue-50"
                      : "bg-white"
                    }`}
                >
                  {combinedOrder
                    .map(headerByKey)
                    .filter(Boolean)
                    .map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-4 text-slate-700 whitespace-nowrap"
                      >
                        {col.render ? col.render(item[col.key], item) : (item[col.key] ?? "-")}
                      </td>
                    ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-4 gap-4 text-sm w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="text-slate-500 font-medium">
            Total Records: <span className="text-slate-900">{filteredData.length}</span>
          </div>
          {showDownload && (
            <DownloadExcel
              tableData={exportTableData || tableData}
              tableHeaders={tableHeaders}
            />
          )}
        </div>

        {showPagination && (
          <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-slate-200">
            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <Icons.SkipBack size={18} />
            </button>

            <div className="flex items-center gap-1.5 px-2 text-slate-600">
              <input
                type="number"
                value={page}
                onChange={(e) => {
                  const newPage = Number(e.target.value);
                  if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
                }}
                className="w-10 text-center font-semibold bg-slate-50 border border-slate-200 rounded py-0.5"
              />
              <span>of {totalPages}</span>
            </div>

            <button
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              disabled={page === totalPages || totalPages === 0}
              onClick={() => setPage(page + 1)}
            >
              <Icons.SkipForward size={18} />
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <select
              className="bg-transparent font-medium text-slate-700 px-2 py-1 outline-none cursor-pointer"
              value={perPage}
              onChange={(e) => {
                const value =
                  e.target.value === "All" ? "All" : Number(e.target.value);
                setPerPage(value);
              }}
            >
              {itemsPerPageOptions.map((item, i) => (
                <option key={i} value={item}>
                  {item === "All" ? "All results" : `${item} per page`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomTable;
