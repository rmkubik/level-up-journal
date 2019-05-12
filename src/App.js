import React, { Component } from "react";
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from "styled-components";
import brace from "brace";
import "brace/mode/markdown";
import "brace/theme/dracula";
import "./App.css";

// This is needed because of how create-react-app works...
// This will break the web version of the app
const { ipcRenderer } = window.require("electron");
const settings = window.require("electron-settings");

class App extends Component {
  state = {
    loadedFile: "",
    // this is a JSON-looking key value store in the file:
    // username/Library/Application\ Support/journal/Settings
    directory: settings.get("directory") || null
  };

  constructor() {
    super();

    ipcRenderer.on("new-file", (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
    });

    ipcRenderer.on("new-dir", (event, filePaths, dirPath) => {
      this.setState({
        directory: dirPath,
        filePaths
      });
      settings.set("directory", dirPath);
    });
  }

  render() {
    return (
      <div className="App">
        <Header>Journal</Header>
        {this.state.directory ? (
          <Split>
            <CodeWindow>
              <AceEditor
                mode="markdown"
                theme="dracula"
                onChange={newContent => {
                  this.setState({
                    loadedFile: newContent
                  });
                }}
                name="markdown_editor"
                value={this.state.loadedFile}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{this.state.loadedFile}</Markdown>
            </RenderedWindow>
          </Split>
        ) : (
          <LoadingMessage>
            <h2>Press CmdOrCtrl + O to open a directory.</h2>
          </LoadingMessage>
        )}
      </div>
    );
  }
}

export default App;

const LoadingMessage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  background-color: #191324;
  height: 100vh;
`;

const Header = styled.header`
  background-color: #191324;
  color: #75717c;
  font-size: 0.8rem;
  height: 23px;
  text-align: center;
  position: fixed;
  box-shadow: 0px 3px 3px rgba(0, 0, 0, 0.2);
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
  -webkit-app-region: drag;
`;

const Split = styled.div`
  display: flex;
  height: 100vh;
`;

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: #191324;
`;

const RenderedWindow = styled.div`
  background-color: #191324;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #302b3a;
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    color: #82d8d8;
  }
  h1 {
    border-bottom: solid 3px #e54b4b;
    padding-bottom: 10px;
  }
  a {
    color: #e54b4b;
  }
`;
