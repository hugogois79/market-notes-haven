import React from "react";
import { Note } from "@/types";

interface CryptoDashboardProps {
  notes: Note[];
  loading: boolean;
}

const CryptoDashboard: React.FC<CryptoDashboardProps> = ({ notes, loading }) => {
  return (
    <div>
      <h1>Crypto Dashboard</h1>
      {loading ? (
        <p>Loading crypto data...</p>
      ) : (
        <div>
          <p>Found {notes.filter(note => note.category === "Crypto").length} crypto-related notes</p>
          {/* Display crypto-specific content here */}
        </div>
      )}
    </div>
  );
};

export default CryptoDashboard;
