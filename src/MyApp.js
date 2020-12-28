import React from 'react';
import ReactDOM from 'react-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import * as data from './course-api.json'
import { Toast, Button, Navbar } from 'react-bootstrap'
import { saveAs } from 'file-saver';
import { Typeahead } from 'react-bootstrap-typeahead'
import SplitPane from 'react-split-pane'
import Sidebar from "react-sidebar";
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

const mql = window.matchMedia(`(min-width: 800px)`);

class MyApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      w: 0,
      h: 0,
      selected: ["15-", "18-", "21-", "36-", "11-"],
      keyword: [],
      specificCourses: [],
      cyElements: [],
      currentNodes: [],
      selectedNode: null,
      mouseoverNode: null,
      updated: true,
      sidebarDocked: mql.matches,
      sidebarOpen: false
    }
    this.renderCytoscapeElement = this.renderCytoscapeElement.bind(this);
    this.getCourseName = this.getCourseName.bind(this);
    this.createNewNode = this.createNewNode.bind(this);
    this.addEdges = this.addEdges.bind(this);
    this.courseNumStartWith = this.courseNumStartWith.bind(this);
    this.courseNameContains = this.courseNameContains.bind(this);
    this.getChildren = this.getChildren.bind(this);
    this.getDescendents = this.getDescendents.bind(this);
    this.getSetDescendents = this.getSetDescendents.bind(this);
    this.computeAllNodes = this.computeAllNodes.bind(this);
    this.mediaQueryChanged = this.mediaQueryChanged.bind(this);
    this.onSetSidebarOpen = this.onSetSidebarOpen.bind(this);
    this.onSetOpen = this.onSetOpen.bind(this);


    this.courseData = data;
    this.courses = this.courseData["default"]["courses"];
    this.courseNums = Object.keys(this.courses)
    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    this.options = ["15-", "18-", "21-", "36-", "11-"];
    this.keywords = ["Theory", "Distributed", "Security", "Finance", "Programming", "Parallel", "Statistics", "Probability"]



  }

  getCourseName(courseNum) {
    return (courseNum in this.courses) ? this.courses[courseNum]['name'] : "None";
  }


  courseNumStartWith(item) {
    for (const prefix of this.state.selected) {
      if (item.includes(prefix)) {
        return true;
      }
    }

    for (const prefix of this.state.specificCourses) {
      if (item.includes(prefix)) {
        return true;
      }
    }

    return false;
  }

  courseNameContains(item) {
    for (const prefix of this.state.keyword) {
      if (this.courses[item]['name'].includes(prefix)) {
        return true;
      }
    }

    return false;
  }

  getChildren(item) {
    let children = [];
    if (item in this.courses) {

      if ((this.courses[item]['prereqs_obj']['reqs_list'])) {
        children = (this.courses[item]['prereqs_obj']['reqs_list']).flat();
      }
    }

    return children.filter(child => (child in this.courses));
  }

  getChildrenLogic(item) {
    let children = [];
    if (item in this.courses) {

      if ((this.courses[item]['prereqs_obj']['reqs_list'])) {
        children = (this.courses[item]['prereqs_obj']['reqs_list']).map(childlist => childlist.filter(child => (child in this.courses)));
      }
    }

    return children;
  }

  getDescendents(item) {
    let descendents = new Set();
    let visited = new Set();
    let unvisited = [item];


    // arbitrary search
    while (unvisited.length > 0) {
      let mostRecent = unvisited.pop();
      visited.add(mostRecent);
      let recentChildren = this.getChildren(mostRecent);

      for (const child of recentChildren) {
        if (!visited.has(child)) {
          unvisited.push(child);
        }

        descendents.add(child);
      }

    }

    return Array.from(descendents);
  }

  getSetDescendents(vertices) {
    let allVertices = new Set(vertices);

    function union(setA, setB) {
      let _union = new Set(setA)
      for (let elem of setB) {
        _union.add(elem)
      }
      return _union
    }

    for (const vertex of vertices) {
      let descendents = this.getDescendents(vertex);
      allVertices = union(allVertices, descendents);
    }

    console.log("descendents", vertices, allVertices);
    return Array.from(allVertices);

  }

  computeAllNodes(allNodes) {
    let mainNodes = allNodes.filter(item => (this.courseNumStartWith(item) || this.courseNameContains(item)))
    let result = new Set(this.getSetDescendents(mainNodes));
    console.log("no repeat", result);
    return Array.from(result);
  }

  createNewNode(item, index) {

    let color = "blue";

    if (this.state.specificCourses.includes(item)) {
      color = "orange";
    } else if (this.state.selectedNode === item) {
      color = "red";
    }


    //this.setState({cyElements: this.state.cyElements.concat([{data: {id: item, name: this.getCourseName(item) }  }]),
    //currentNodes:this.state.cyElements.concat([item]),
    //updated: false});


    this.cyElements.push({ data: { id: item, name: this.getCourseName(item), color: color } });
    //this.currentNodes.push(item);
    //this.mainNodes.push(item);

  }


  addEdges(item, index) {




    let children = this.getChildrenLogic(item); //this.getChildren(item);



    let generateEdge = (color) => (item2, index) => {
      if (this.currentNodes.includes(item2)) {
        this.cyElements.push({ data: { id: (item + " " + item2), source: item, target: item2, arrow: "triangle", color: color } });

        //this.setState({cyElements: this.state.cyElements.concat([{data: {id: (item+" "+item2), source: item, target: item2 }  }]),
        //updated: false});

      }

    }

    function randomColor() {
      return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
    }

    function generateRandomColor(n) {

      let colorList = [ "#C70039",
                        "#229954",
                        "#3498DB",
                        "#8E44AD",
                        "#F39C12",
                        "#273746"]
      //let colorList = []
      while (colorList.length < n) {
        let color = "";

        do {
          color = randomColor();
        } while (colorList.includes(color));

        colorList.push(color);
      }

      return colorList;
    }

    let generateEdgeSet = (childList, index) => {
      childList.forEach(generateEdge(colorList[index]));
    }

    let numColor = children.length;
    let colorList = generateRandomColor(numColor);

    children.forEach(generateEdgeSet);


  }



  renderCytoscapeElement() {
    console.log(this.state.selectedNode, "selected node");


    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    console.log('* Cytoscape.js is rendering the graph..');

    this.currentNodes = this.computeAllNodes(Object.keys(this.courses))
    this.currentNodes.forEach(this.createNewNode);
    this.currentNodes.forEach(this.addEdges);






    this.setState({
      cyElements: this.cyElements,
      currentNodes: this.currentNodes,
      updated: true
    });

    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: this.cyElements,
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'label': 'data(name)'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'background-color': 'red',
            'line-color': 'yellow',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red',
          }

        },
        {
          "selector": "edge",
          "style": {
            "width": 4,
            "curve-style": "bezier",
            "line-color": 'data(color)'
          }
        },

        {
          "selector": 'edge[arrow]',
          "style": {
            'arrow-scale': 2,
            'target-arrow-shape': 'data(arrow)'

          }
        }

      ],

      layout: {
        name: 'breadthfirst',
        fit: true, // whether to fit the viewport to the graph
        directed: false, // whether the tree is directed downwards (or edges can point in any direction if false)
        padding: 30, // padding on fit
        circle: false, // put depths in concentric circles if true, put depths top down if false
        grid: false, // whether to create an even grid into which the DAG is placed (circle:false only)
        spacingFactor: 1.75, // positive spacing factor, larger => more space between nodes (N.B. n/a if causes overlap)
        boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
        nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
        roots: undefined, // the roots of the trees
        maximal: false, // whether to shift nodes down their natural BFS depths in order to avoid upwards edges (DAGS only)
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
        animationEasing: undefined, // easing of animation if enabled,
        animateFilter: function (node, i) { return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
        ready: undefined, // callback on layoutready
        stop: undefined, // callback on layoutstop
        transform: function (node, position) { return position; } // transform a given node position. Useful for changing flow direction in discrete layouts
      }


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

    });




    console.log("over", this.state);






  }

  onSetOpen(open) {
    this.setState({ open });
  }

  onSetSidebarOpen(ev) {
    this.setState({ sidebarOpen: !this.state.sidebarOpen });
  }

  mediaQueryChanged() {
    this.setState({ sidebarDocked: mql.matches, sidebarOpen: false });
  }

  componentWillMount() {
    mql.addListener(this.mediaQueryChanged);
  }

  componentWillUnmount() {
    this.state.mql.removeListener(this.mediaQueryChanged);
  }

  componentDidMount() {
    this.setState({ w: window.innerWidth, h: window.innerHeight });
    this.renderCytoscapeElement();
    console.log("component mount", this.state);





  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if ((prevState.specificCourses !== this.state.specificCourses || prevState.selected !== this.state.selected || prevState.keyword !== this.state.keyword) && !this.state.updated) {
      console.log("hello");
      this.renderCytoscapeElement();
      console.log(this.state);
    }
  }




  render() {
    //let el = document.getElementById("cy");
    //console.log(el);

    console.log(data); // output 'testing'



    let cyStyle = {
      height: this.state.h,
      width: this.state.w
    };



    return (
      <React.Fragment>
        <Navbar bg="light" expand="lg">

          <Button
            variant="primary"
            onClick={this.onSetSidebarOpen}
          >
            Open
                  </Button>
          <Navbar.Brand href="#home">React-Bootstrap</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            Content
        </Navbar.Collapse>
        </Navbar>
        <SplitPane split="vertical" minSize={200}>
          <Sidebar
            sidebar={
              <React.Fragment>
                <Button
                  variant="primary"
                  onClick={this.onSetSidebarOpen}
                >
                  Close
                  </Button>
                <Typeahead
                  clearButton
                  defaultSelected={this.options}
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
                  defaultSelected={[]}
                  id="course-number"
                  labelKey="courseNum"
                  multiple
                  options={this.courseNums}
                  placeholder="Choose a state..."
                  onChange={(selected) => {
                    this.setState({ specificCourses: selected, updated: false })
                  }}
                />
                {this.state.selectedNode &&
                  <Toast>
                    <Toast.Header>
                      <strong className="mr-auto">{`${this.state.selectedNode} ${this.courses[this.state.selectedNode]['name']}`}</strong>
                      <small>{`${this.courses[this.state.selectedNode]['units']} units`}</small>
                    </Toast.Header>
                    <Toast.Body>{this.courses[this.state.selectedNode]['desc']}</Toast.Body>
                  </Toast>
                }
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

            }
            open={this.state.sidebarOpen}
            onSetOpen={this.onSetOpen}
          >

          </Sidebar>
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