import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";

export type DataTableColumn<Row> = {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
  minWidth?: number;
  render: (row: Row) => ReactNode;
};

export type DataTableProps<Row> = {
  rows: Row[];
  columns: DataTableColumn<Row>[];
  getRowKey: (row: Row) => string | number;
  emptyMessage?: string;
};

export function DataTable<Row>({
  rows,
  columns,
  getRowKey,
  emptyMessage = "No records found.",
}: DataTableProps<Row>) {
  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 2, overflowX: "auto" }}
    >
      <Table stickyHeader sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                align={column.align}
                key={column.id}
                sx={{ minWidth: column.minWidth }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row) => (
              <TableRow hover key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell align={column.align} key={column.id}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography
                  color="text.secondary"
                  sx={{ py: 3, textAlign: "center" }}
                >
                  {emptyMessage}
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
