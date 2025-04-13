
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProtocolHandler } from "@/hooks/use-protocol-handler";

const ProtocolHandler = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { handleProtocolActivation } = useProtocolHandler(navigate);

  useEffect(() => {
    // Handle any protocol parameters that might be in the URL
    handleProtocolActivation(window.location.href);
  }, [handleProtocolActivation, location.pathname]);

  return null; // This component doesn't render anything
};

export default ProtocolHandler;
