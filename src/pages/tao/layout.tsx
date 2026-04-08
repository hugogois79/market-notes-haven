
import React from "react";
import { Outlet } from "react-router-dom";

const TAOLayout = () => {
  return (
    <div className="container mx-auto py-6">
      <Outlet />
    </div>
  );
};

export default TAOLayout;
