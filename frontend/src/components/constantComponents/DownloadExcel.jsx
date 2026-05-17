import React from "react";
import * as XLSX from "xlsx";
import Icons from "../../assets/icons";
import { toast } from "react-toastify";

const DownloadExcel = ({ tableData = [], tableHeaders = [], filename = "table-data.xlsx" }) => {
    const handleDownload = () => {
        if (!tableData || tableData.length === 0) {
            return;
        }

        const filteredHeaders = tableHeaders.filter(
            (header) =>
                !(header.label.toLowerCase().includes("action") ||
                    header.key.toLowerCase().includes("action"))
        );

        const headers = filteredHeaders.map((h) => h.label);
        const keys = filteredHeaders.map((h) => h.key);

        const data = tableData.map((row) => {
            const obj = {};
            keys.forEach((key, index) => {
                obj[headers[index]] =
                    typeof row[key] === "string" || typeof row[key] === "number"
                        ? row[key]
                        : "-";
            });
            return obj;
        });


        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet 1");
        XLSX.writeFile(workbook, filename);
        toast.success("Excel downloaded!");
    };

    return (
        <button
            onClick={handleDownload}
            className="border py-2 px-3 rounded-lg cursor-pointer border-[var(--light-gray)] bg-white hover:bg-gray-100 text-sm flex items-center gap-2"
        >
            <Icons.Download size={16} />
            Download Excel
        </button>
    );
};

export default DownloadExcel;
