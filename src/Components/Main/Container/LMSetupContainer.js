import React, { useEffect } from "react";
import { DataContainer, DataSubContainer } from "../../Style";
import LMCommonSetup from "../LMCommonSetup";
import LMLogicSetup from "../LMLogicSetup";
const { ipcRenderer } = window.require("electron");

function LMSetupContainer() {
  useEffect(() => {
    ipcRenderer.send("request-lm-setup");
  }, []);

  return (
    <DataContainer>
      <DataSubContainer>
        <LMCommonSetup />
      </DataSubContainer>
    </DataContainer>
  );
}

export default LMSetupContainer;
