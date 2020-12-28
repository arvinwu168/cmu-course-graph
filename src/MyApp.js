import React from 'react';
import ReactDOM from 'react-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import * as data from './course-api.json'
import { Card, Button, Navbar, ToggleButton, ButtonGroup } from 'react-bootstrap'
import { saveAs } from 'file-saver';
import { Typeahead } from 'react-bootstrap-typeahead'
import SplitPane from 'react-split-pane'
import styled from "styled-components";
import { cytographStyles, cytographLayout } from './components/CytographInfo'
import {computeAllNodes, 
        createNewNode, 
        addEdges,
        DisplayStyle } from './utils'

//import Sidebar from "react-sidebar";
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const StyledSideNav = styled.div`
  position: fixed;     /* Fixed Sidebar (stay in place on scroll and position relative to viewport) */
  height: 100%;
  width: 200px;     /* Set the width of the sidebar */
  z-index: 1;      /* Stay on top of everything */
  top: 0em;      /* Stay at the top */
  background-color: #F0E8E6; /* Black */
  overflow-x: hidden;     /* Disable horizontal scroll */
  padding-top: 10px;
`;

const BottomRightCorner = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
`



class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      w: 0,
      h: 0,
      displayStyle: DisplayStyle.ROOTS,
      selected: [],
      keyword: [],
      specificCourses: ['15-251','15-210'],
      cyElements: [],
      currentNodes: [],
      selectedNode: null,
      mouseoverNode: null,
      updated: true,
    }
    this.renderCytoscapeElement = this.renderCytoscapeElement.bind(this);
    


    this.courseData = data;
    this.courses = this.courseData["default"]["courses"];
    this.courseNums = Object.keys(this.courses)
    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    this.options = ['15-','18','21'];
    this.keywords = ["Theory", "Distributed", "Security", "Finance", "Programming", "Parallel", "Statistics", "Probability"]



  }

  renderCytoscapeElement() {
    console.log(this.state.selectedNode, "selected node");


    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    console.log('* Cytoscape.js is rendering the graph..');

    this.currentNodes = computeAllNodes(Object.keys(this.courses), 
                                        this.state.displayStyle, 
                                        this.courses, 
                                        this.state.selected, 
                                        this.state.specificCourses, 
                                        this.state.keyword)

    this.currentNodes.forEach(createNewNode(this.cyElements,
                                            this.state.specificCourses,
                                            this.selectedNode, 
                                            this.courses));

    this.currentNodes.forEach(addEdges( this.cyElements,
                                        this.currentNodes,
                                        this.courses,
                                        this.state.displayStyle));
    
                                        
    console.log("display style",this.state.displayStyle);






    this.setState({
      cyElements: this.cyElements,
      currentNodes: this.currentNodes,
      updated: true
    });

    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: this.cyElements,
      style: cytographStyles,
      layout: cytographLayout,
    });

    //let cy = document.getElementById('cy');
    this.cy.on('select', e => {
      console.log("clicked", e.target.id());
      if (e.target.isNode()) {
        this.setState({ selectedNode: e.target.id() });
      }

      e.target.select();

    });

    this.cy.on('mouseover', e => {
      //console.log("mouseover");
    });




    console.log("over", this.state);






  }

  onSetOpen(open) {
    this.setState({ open });
  }


  componentDidMount() {
    this.setState({ w: window.innerWidth, h: window.innerHeight });
    this.renderCytoscapeElement();
    console.log("component mount", this.state);





  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((prevState.specificCourses !== this.state.specificCourses || 
         prevState.selected !== this.state.selected || 
         prevState.keyword !== this.state.keyword ||
         prevState.displayStyle !== this.state.displayStyle) && !this.state.updated) {
      console.log("hello");
      this.renderCytoscapeElement();
      console.log(this.state);
    }
  }




  render() {
    //let el = document.getElementById("cy");
    //console.log(el);




    let cyStyle = {
      height: this.state.h,
      width: this.state.w
    };

    const displayOptions = [
      { name: 'Root', value: DisplayStyle.ROOTS },
      { name: 'Children', value: DisplayStyle.CHILDREN },
    ];



    return (
      <React.Fragment>
        <SplitPane split="vertical">
          <StyledSideNav>
            <React.Fragment>
              <ButtonGroup toggle>
                {displayOptions.map((option, idx) => (
                  <ToggleButton
                    key={idx}
                    type="radio"
                    variant="secondary"
                    name="displayOptionPanel"
                    value={option.value}
                    checked={this.state.displayStyle === option.value}
                    onChange={(e) => {
                      console.log("display style compare",this.state.displayStyle,(e.currentTarget.value),DisplayStyle,DisplayStyle.ROOTS !== DisplayStyle.CHILDREN);
                      this.setState({displayStyle: (e.currentTarget.value), updated: false});
                      
                    }}
                  >
                    {option.name}
                  </ToggleButton>
                ))}
              </ButtonGroup>
              <Typeahead
                clearButton
                defaultSelected={[]}
                id="department-affiliation"
                labelKey="department"
                multiple
                options={this.options}
                placeholder="Choose a state..."
                onChange={(selected) => {
                  this.setState({ selected: selected, updated: false })
                }}
              />
              <Typeahead
                clearButton
                defaultSelected={[]}
                id="course-name-keyword"
                labelKey="keyword"
                multiple
                options={this.keywords}
                placeholder="Choose a state..."
                onChange={(selected) => {
                  this.setState({ keyword: selected, updated: false })
                }}
              />
              <Typeahead
                clearButton
                defaultSelected={['15-251','15-210']}
                id="course-number"
                labelKey="courseNum"
                multiple
                options={this.courseNums}
                placeholder="Choose a state..."
                onChange={(selected) => {
                  this.setState({ specificCourses: selected, updated: false })
                }}
              />
              <Button
                variant="primary"
                onClick={() => {
                  let cyPNG = this.cy.png();
                  saveAs(cyPNG, "course-map.png");
                }}
              >
                Download
              </Button>
            </React.Fragment>
          </StyledSideNav>
          <div
            style={cyStyle}
            id="cy"
            onSelect={(evt) => {
              var node = evt.target;
              this.setState({ selectedNode: node.id(), updated: false })
              console.log('selected ' + node.id());
            }}
          >
          </div>
        </SplitPane>
        <BottomRightCorner>
          {this.state.selectedNode &&
            <Card style={{ width: '50rem' }}>
              <Card.Body>
                <Card.Title>
                  <strong className="mr-auto">{`${this.state.selectedNode} ${this.courses[this.state.selectedNode]['name']}`}</strong>
                </Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  <small>{`${this.courses[this.state.selectedNode]['units']} units`}</small>
                </Card.Subtitle>
                <Card.Text>
                  {this.courses[this.state.selectedNode]['desc']}
                </Card.Text>
              </Card.Body>
            </Card>
          }
        </BottomRightCorner>
      </React.Fragment>
    );

    /*const elements = [
       { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
       { data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 } },
       { data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2' } }
    ]; */




  }
}



export default MyApp;