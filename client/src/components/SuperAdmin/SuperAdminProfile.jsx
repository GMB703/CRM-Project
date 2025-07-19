import React from "react";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/slices/authSlice";
import { Card, Typography, Box } from "@mui/material";

const SuperAdminProfile = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <Box className="flex justify-center items-center min-h-[60vh]">
      <Card className="p-8 max-w-lg w-full shadow-lg">
        <Typography variant="h5" className="mb-4 font-bold">
          Super Admin Profile
        </Typography>
        <Typography variant="body1" className="mb-2">
          <strong>Name:</strong> {user?.firstName} {user?.lastName}
        </Typography>
        <Typography variant="body1" className="mb-2">
          <strong>Email:</strong> {user?.email}
        </Typography>
        <Typography variant="body1" className="mb-2">
          <strong>Role:</strong> {user?.role}
        </Typography>
        {/* Add more profile fields as needed */}
      </Card>
    </Box>
  );
};

export { SuperAdminProfile }; 