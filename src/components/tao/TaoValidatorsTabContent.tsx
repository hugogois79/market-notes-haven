
import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const TaoValidatorsTabContent: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Validator</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Delegation</TableHead>
            <TableHead>Uptime</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            { rank: 1, validator: "Validator Alpha", stake: "542,156 τ", delegation: "12.4%", uptime: "99.98%", status: "active" },
            { rank: 2, validator: "Validator Beta", stake: "498,732 τ", delegation: "11.3%", uptime: "99.95%", status: "active" },
            { rank: 3, validator: "Validator Gamma", stake: "421,845 τ", delegation: "9.6%", uptime: "99.91%", status: "active" },
            { rank: 4, validator: "Validator Delta", stake: "387,291 τ", delegation: "8.8%", uptime: "99.87%", status: "active" },
            { rank: 5, validator: "Validator Epsilon", stake: "356,478 τ", delegation: "8.1%", uptime: "99.82%", status: "active" },
            { rank: 6, validator: "Validator Zeta", stake: "312,654 τ", delegation: "7.1%", uptime: "99.76%", status: "jailed" },
          ].map((validator) => (
            <TableRow key={validator.rank}>
              <TableCell>{validator.rank}</TableCell>
              <TableCell className="font-medium">{validator.validator}</TableCell>
              <TableCell>{validator.stake}</TableCell>
              <TableCell>{validator.delegation}</TableCell>
              <TableCell>{validator.uptime}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  validator.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {validator.status}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TaoValidatorsTabContent;
