
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TAOManagement: React.FC = () => {
  const navigate = useNavigate();
  
  // Redirect to validator management with Kanban view immediately
  useEffect(() => {
    navigate('/tao/validators');
  }, [navigate]);

  // This component will not actually render anything as it will immediately redirect
  return null;
};

export default TAOManagement;
