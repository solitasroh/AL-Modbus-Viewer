import React, { useState, useEffect, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { set, useForm } from "react-hook-form";
import oc from "open-color";
import Modal from "styled-react-modal";
import ApplyButton from "./ApplyButton";
import LMCommonSetup from "./Main/LMCommonSetup";
import LMAlarm from "./Main/LMAlarm";
import { useInterval } from "../Hooks/useInterval";
const { ipcRenderer } = window.require("electron");

const pattern =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const Container = styled.div`
  color: black;
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
`;
const InfoLabel = styled.label`
  color: #fafafa;
  font-size: 10px;
  margin-bottom: 5px;
`;
const fadeIn = keyframes`
  0%{
    opacity: 1;
  }
  50%{
    opacity: 0;
  }
  100%{
    oapcity: 1;
  }
`;
const ConnecionState = styled.div`
  color: #fafafa;
  font-size: 10px;
  margin-bottom: 5px;
  opacity: 1;
  color: ${(prop) => (prop.connected ? oc.teal[6] : "red")};
  animation: ${fadeIn} ${(prop) => (prop.connected ? "0s" : "2.5s")} infinite;
`;
const IpAddress = styled.label`
  color: white;
  font-weight: 600;
  font-size: 15px;
  margin-bottom: 5px;
`;

const DialogContainer = styled.div`
  height: 100%;
  background-color: grey;
`;

const StyledModal = Modal.styled`
  width: 200px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
`;
const Input = styled.input`
  width: 100%;
  border: 1px solid grey;
  outline: none;
  border-radius: 0px;
  line-height: 1.2rem;
  font-size: 12px;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
`;
const IPForm = styled.form`
  padding: 10px;
`;
const IPLabel = styled.label`
  font-size: 10px;
  font-weight: 600;
  color: black;
`;

const STATE_CONNECTED = 1;
const STATE_DISCONNECTED = 2;
const STATE_CHANGE_IP = 3;
const STATE_REQUEST_CONNECT = 4;
const STATE_RECV_SERVER_RESP = 5;

const StateToDisplay = (state) => {
  switch (state) {
    case STATE_CONNECTED:
      return "CONNECTED";
    case STATE_DISCONNECTED:
      return "DISCONNECTED";
    case STATE_REQUEST_CONNECT:
      return "try to connect";
    default:
      return "INVALID";
  }
};

function DeviceController() {
  const [modelIsOpen, setIsOpen] = useState(false);
  const [ipAddr, setIpAddr] = useState("127.0.0.1");
  const [state, setState] = useState(STATE_DISCONNECTED);
  const [serialList, setSerialList] = useState([]);
  const { register, handleSubmit, watch, errors } = useForm();

  useEffect(() => {
    ipcRenderer.on("resp-connect-to-server", (evt, arg) => {
      const { connectState, ip } = arg;
      if (connectState === true) {
        setState(STATE_CONNECTED);
        ipcRenderer.send("get-lm-setup");
      } else {
        console.log("disconnected..");
        setState(STATE_DISCONNECTED);
      }
    });

    ipcRenderer.on("server-connection-state", (evt, isConnected) => {
      if (isConnected === false) {
        console.log("disconnected from server");
        setState(STATE_DISCONNECTED);
      }
    });

    ipcRenderer.on("error-disconnected", (evt, args) => {
      setState(STATE_DISCONNECTED);
    });
    ipcRenderer.on("resp-serial-list", (evt, paths) => {
      setSerialList(paths);
    });
    console.log("send connect server");
    // try to connect modbus server
    setState(STATE_REQUEST_CONNECT);
    ipcRenderer.send("connect-to-server", { ip: ipAddr });
    ipcRenderer.send("get-serial-list");
    return () => {
      ipcRenderer.removeAllListeners("get-connection-result");
    };
  }, []);

  useInterval(() => {
    if (state === STATE_CONNECTED) {
      ipcRenderer.send("get-connect-server-state");
      return;
    }

    if (state === STATE_DISCONNECTED) {
      console.log("request connect to server. change state..");
      setState(STATE_REQUEST_CONNECT);
      ipcRenderer.send("connect-to-server", { ip: ipAddr });
    }
  }, 5000);

  const onSubmit = ({ ipAddress }) => {
    setState(STATE_REQUEST_CONNECT);
    ipcRenderer.send("connect-to-server", { ip: ipAddress });
    setIpAddr(ipAddress);
    closeModal();
  };

  const onError = (error) => {
    console.log(error);
  };

  const openModal = () => {
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Container>
      <InfoLabel>device IP</InfoLabel>
      <IpAddress>{ipAddr}</IpAddress>
      <ConnecionState connected={state === STATE_CONNECTED}>
        {StateToDisplay(state)}
      </ConnecionState>
      <ApplyButton name="change connect" onClick={openModal} />
      <LMAlarm></LMAlarm>
      {/* <select>
        {serialList.map((path) => (
          <option value={(path.id, path.key)}>{path.key}</option>
        ))}
      </select> */}
      <StyledModal isOpen={modelIsOpen} onEscapeKeydown={closeModal}>
        <IPForm onSubmit={handleSubmit(onSubmit, onError)}>
          <IPLabel>ip address</IPLabel>
          <Input
            type="text"
            defaultValue="0.0.0.0"
            placeholder="ip address"
            {...register("ipAddress", {
              pattern: {
                value: pattern,
                message: "invalid ip address",
              },
              required: true,
            })}
          />

          <ApplyButton>Apply</ApplyButton>
        </IPForm>
      </StyledModal>
    </Container>
  );
}

export default DeviceController;
