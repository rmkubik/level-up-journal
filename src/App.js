import React, { Component } from "react";
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from "styled-components";
import brace from "brace";
import "brace/mode/markdown";
import "brace/theme/dracula";
import "./App.css";

// This `window.require` is needed because of how create-react-app works...allegedly
// This will break the web version of the app
const { ipcRenderer } = window.require("electron");
const settings = window.require("electron-settings");
const fs = window.require("fs");

class App extends Component {
  state = {
    loadedFile: "",
    // this is a JSON-looking key value store in the file:
    // username/Library/Application\ Support/journal/Settings
    directory: settings.get("directory") || null,
    filesData: []
  };

  constructor() {
    super();

    ipcRenderer.on("new-file", (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
    });

    ipcRenderer.on("new-dir", (event, directory) => {
      this.setState({
        directory
      });
      settings.set("directory", directory);
      this.loadAndReadFiles(directory);
    });

    const { directory } = this.state;

    if (directory) {
      this.loadAndReadFiles(directory);
    }
  }

  loadFile = index => {
    const { filesData } = this.state;
    const { path } = filesData[index];

    const content = fs.readFileSync(path).toString();

    this.setState({
      loadedFile: content
    });
  };

  loadAndReadFiles = directory => {
    fs.readdir(directory, (err, files) => {
      const filteredFiles = files.filter(path => path.includes(".md"));
      const filesData = filteredFiles.map(file => ({
        path: `${directory}/${file}`
      }));

      this.setState(
        {
          filesData
        },
        () => this.loadFile(0)
      );
    });
  };

  render() {
    return (
      <AppWrap>
        <Header>Journal</Header>
        {this.state.directory ? (
          <Split>
            <FilesWindow>
              {this.state.filesData.map(({ path }, index) => (
                <button key={index} onClick={() => this.loadFile(index)}>
                  {path}
                </button>
              ))}
            </FilesWindow>
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
      </AppWrap>
    );
  }
}

export default App;

const AppWrap = styled.div`
  margin-top: 23px;
`;

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

const FilesWindow = styled.div`
  background-color: #140f1d;
  border-right: solid 1px #302b3a;
  position: relative;
  width: 20%;
  &:after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    box-shadow: -10px 0 20px rgba(0, 0, 0, 0.3) inset;
  }
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
