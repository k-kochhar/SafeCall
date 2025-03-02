import { Paper } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useState, useEffect } from "react";

export default function DashboardTable() {
  const columns = [
    { field: "id", headerName: "User ID", width: 50 }, //user id (uid)
    { field: "name", headerName: "Name", width: 120 }, // firstName + lastName of user
    { field: "number", headerName: "Phone Number", width: 120 }, //user phone #
    { field: "emergency", headerName: "Emergency Contact", width: 120 }, //emergency contact name: their #
    { field: "background", headerName: "Background Info", width: 120 }, //background info for user
    { field: "callHistory", headerName: "Previous Call History", width: 120 }, //previous call history
  ];

  const [rows, setRows] = useState();

  useEffect(() => {
    fetch("http://127.0.0.1:3001/all-users/") // Use the backend API endpoint
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
        if (data.users) {
          const formattedRows = data.users.map((user, index) => ({
            id: index + 1, // DataGrid needs a unique id
            name: `${user.firstName} ${user.lastName}`,
            phone_number: user.phoneNumber || "N/A",
            emergency_contact: user.emergencyContact || "N/A",
            background_info: user.backgroundInfo || "N/A",
            previous_call_history: user.previousCallHistory,
            profile: user.backgroundInfo || "N/A",
          }));
          setRows(formattedRows);
          console.log(formattedRows);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
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
