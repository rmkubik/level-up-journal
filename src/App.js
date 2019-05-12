import React, { Component } from "react";
import Markdown from "markdown-to-jsx";
import AceEditor from "react-ace";
import styled from "styled-components";
import dateFns from "date-fns";
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
    filesData: [],
    newEntry: false,
    newEntryName: "",
    activeIndex: 0
  };

  constructor() {
    super();

    ipcRenderer.on("new-file", (event, fileContent) => {
      this.setState({
        loadedFile: fileContent
      });
    });

    ipcRenderer.on("save-file", event => {
      this.saveFile();
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
      loadedFile: content,
      activeIndex: index
    });
  };

  changeFile = index => () => {
    const { activeIndex } = this.state;

    if (index !== activeIndex) {
      this.saveFile();
      this.loadFile(index);
    }
  };

  saveFile = () => {
    const { activeIndex, loadedFile, filesData } = this.state;

    fs.writeFile(filesData[activeIndex].path, loadedFile, err => {
      if (err) return console.log(err);

      console.log("File Saved!");
    });
  };

  loadAndReadFiles = directory => {
    fs.readdir(directory, (err, files) => {
      const filteredFiles = files.filter(path => path.includes(".md"));
      const filesData = filteredFiles.map(file => {
        const date = file.substring(file.indexOf("_") + 1, file.indexOf("."));

        return {
          date,
          title: file.substring(0, file.indexOf("_")),
          path: `${directory}/${file}`
        };
      });

      filesData.sort(({ date: dateA }, { date: dateB }) => {
        return new Date(dateB) - new Date(dateA);
      });

      this.setState(
        {
          filesData
        },
        () => this.loadFile(0)
      );
    });
  };

  newFile = event => {
    event.preventDefault();

    const { newEntryName, directory } = this.state;
    const date = dateFns.format(new Date(), "MM-DD-YYYY");
    fs.writeFile(`${directory}/${newEntryName}_${date}.md`, "", err => {
      if (err) return console.log(err);

      this.loadAndReadFiles(directory);

      this.setState({
        newEntry: false,
        newEntryName: ""
      });
    });
  };

  render() {
    const {
      activeIndex,
      directory,
      filesData,
      loadedFile,
      newEntry,
      newEntryName
    } = this.state;
    return (
      <AppWrap>
        <Header>Journal</Header>
        {directory ? (
          <Split>
            <FilesWindow>
              <Button
                onClick={() =>
                  this.setState({
                    newEntry: !newEntry
                  })
                }
              >
                {"+ New Entry"}
              </Button>
              {newEntry && (
                <form onSubmit={this.newFile}>
                  <input
                    autoFocus
                    type="text"
                    value={newEntryName}
                    onChange={event =>
                      this.setState({ newEntryName: event.target.value })
                    }
                  />
                </form>
              )}
              {filesData.map(({ title, date }, index) => (
                <FileButton
                  active={activeIndex === index}
                  key={index}
                  onClick={this.changeFile(index)}
                >
                  <p className="title">{title}</p>
                  <p className="date">{formatDate(date)}</p>
                </FileButton>
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
                value={loadedFile}
              />
            </CodeWindow>
            <RenderedWindow>
              <Markdown>{loadedFile}</Markdown>
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

const FileButton = styled.button`
  padding: 10px;
  width: 100%;
  background-color: #191324;
  opacity: 0.4;
  color: white;
  border: none;
  border-bottom: solid 1px #302b3a;
  transition: 0.3s ease all;
  text-align: left;
  &:hover {
    opacity: 1;
    border-left: solid 4px #82d8d8;
  }
  ${({ active }) =>
    active &&
    `
    opacity: 1;
    border-left: solid 4px #82d8d8;
  `}
  .title {
    font-weight: bold;
    font-size: 0.9rem;
    margin: 0 0.5px;
  }
  .date {
    margin: 0;
  }
`;

const Button = styled.button`
  background-color: transparent;
  color: white;
  border: solid 1px #82d8d8;
  border-radius: 4px;
  margin: 1rem auto;
  font-size: 1rem;
  transition: 0.3s ease all;
  padding: 5px 10px;
  display: block;
  &:hover {
    background-color: #82d8d8;
    color: #191324;
  }
`;

const formatDate = date => dateFns.format(new Date(date), "MMMM Do YYYY");
