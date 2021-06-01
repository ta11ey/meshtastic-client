//@ts-nocheck
import React, { useState } from 'react';

import type {
  IHTTPConnection,
  Protobuf,
  Types,
} from '@meshtastic/meshtasticjs';
//@ts-ignore
import CSV from './lib/csv';
import type { LanguageEnum, languageTemplate } from './App';
import ChatMessage from './components/ChatMessage';
import MessageBox from './components/MessageBox';
import Sidebar from './components/Sidebar';

interface MainProps {
  connection: IHTTPConnection;
  myNodeInfo: Protobuf.MyNodeInfo;
  nodes: Types.NodeInfoPacket[];
  channels: Protobuf.Channel[];
  isReady: boolean;
  language: LanguageEnum;
  setLanguage: React.Dispatch<React.SetStateAction<LanguageEnum>>;
  translations: languageTemplate;
  darkmode: boolean;
  setDarkmode: React.Dispatch<React.SetStateAction<boolean>>;
}

const Main = (props: MainProps) => {
  const [messages, setMessages] = React.useState<
    { message: Types.TextPacket; ack: boolean }[]
  >([]);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const getFiles = async () => {
      //use meshtastic JS to get files.
      const res = await props.connection.getSPIFFS();
      //if device has a messages file
      if (res && res.data.files.find((file) => file.name.includes('messages'))) {
        const messagesStream = await fetch(`${props.connection.url}/static/messages.csv`)
        //@ts-ignore
        const reader = messagesStream && messagesStream.body.getReader();
        let result;
        let decoder = new TextDecoder('utf8');
        let data;
        while (!result?.done) {
          result = await reader.read();
          let chunk = decoder.decode(result.value);
          //weird 2nd blank chunk coming through... luckily this is just Proof of concept
          if (chunk) {
            data += chunk
          }
        }

        const csvData = CSV.parse(data);
        const messageArr = csvData.slice(1).map((message) => ({
          message: {
            data: message[message.length - 1],
            packet: {
              from: message[1],
              to: message[2],
              rxTime: message[0]
            }
          }
        }))
        setMessages(messageArr)
        debugger;
      }
    }
    getFiles();

  }, [props.connection]);

  React.useEffect(() => {
    const textPacketEvent = props.connection.onTextPacketEvent.subscribe(
      (message) => {
        setMessages((messages) => [
          ...messages,
          { message: message, ack: false },
        ]);
      },
    );
    return () => textPacketEvent.unsubscribe();
  }, [props.connection]);

  React.useEffect(() => {
    const routingPacketEvent = props.connection.onRoutingPacketEvent.subscribe(
      (routingPacket) => {
        setMessages(
          messages.map((message) => {
            return routingPacket.packet.payloadVariant.oneofKind ===
              'decoded' &&
              message.message.packet.id ===
                routingPacket.packet.payloadVariant.decoded.requestId
              ? {
                  ack: true,
                  message: message.message,
                }
              : message;
          }),
        );
      },
    );
    return () => routingPacketEvent.unsubscribe();
  }, [props.connection, messages]);

  return (
    <div className="flex flex-col md:flex-row flex-grow m-3 space-y-2 md:space-y-0 space-x-0 md:space-x-2">
      <div className="flex flex-col flex-grow container mx-auto">
        <div className="flex flex-col flex-grow py-6 space-y-2">
          {messages.length ? (
            messages.map((message, Main) => (
              <ChatMessage
                nodes={props.nodes}
                key={Main}
                message={message}
                myId={props.myNodeInfo.myNodeNum}
              />
            ))
          ) : (
            <div className="m-auto text-2xl text-gray-500">
              {props.translations.no_messages_message}
            </div>
          )}
        </div>
        <MessageBox
          connection={props.connection}
          isReady={props.isReady}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          translations={props.translations}
        />
      </div>
      <Sidebar
        isReady={props.isReady}
        nodes={props.nodes}
        channels={props.channels}
        connection={props.connection}
        language={props.language}
        setLanguage={props.setLanguage}
        translations={props.translations}
        myId={props.myNodeInfo.myNodeNum}
        sidebarOpen={sidebarOpen}
        darkmode={props.darkmode}
        setDarkmode={props.setDarkmode}
      />
    </div>
  );
};

export default Main;
