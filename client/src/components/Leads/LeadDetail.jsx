import React from "react";
import { InactivitySettings } from "./InactivitySettings.jsx";
import { Box, Divider } from "@mui/material";

const LeadDetail = ({ lead, onUpdate }) => (
  <Box p={4}>
    {/* ... existing lead details ... */}
    <Divider my={6} />
    <InactivitySettings
      lead={lead}
      onUpdate={(updatedLead) => {
        if (onUpdate) {
          onUpdate(updatedLead);
        }
      }}
    />
    {/* ... rest of the component ... */}
  </Box>
);

export { LeadDetail };
