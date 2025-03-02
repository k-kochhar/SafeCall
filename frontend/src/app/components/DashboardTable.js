import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";

export default function DashboardTable() {
  const columns = [
    { field: "id",        headerName: "User ID",            width: 50 }, //user id (uid)
    { field: "name",      headerName: "Name",               width: 130 }, // firstName + lastName of user
    { field: "time",      headerName: "Date & Time",        width: 130 }, //date and time of call
    { field: "number",    headerName: "Phone Number",       width: 130 }, //user phone #
    { field: "emergency", headerName: "Emergency Contact",  width: 130 }, //emergency contact name: their #
    { field: "notes",     headerName: "Notes",              width: 130 }, //background info for the user
  ];

  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/mockdata.json")
      .then((response) => response.json())
      .then((json) => setRows(json))
      .catch((error) => console.error("Error loading JSON:", error));
  }, []);

  const paginationModel = { page: 0, pageSize: 5 };
  return (
    <Paper sx={{ height: 400, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[5, 10]}
        checkboxSelection
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
