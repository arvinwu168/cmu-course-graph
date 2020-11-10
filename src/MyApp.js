import React from 'react';
import ReactDOM from 'react-dom';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import * as data from './course-api.json'
import { Typeahead } from 'react-bootstrap-typeahead'
import SplitPane from 'react-split-pane'
import 'bootstrap/dist/css/bootstrap.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';

class MyApp extends React.Component {
  constructor(props){
    super(props);
    this.state={w: 0, h: 0, selected: ["15-","18-","21-","36-","11-"], keyword: [], specificCourses: [], cyElements: [], currentNodes: [],updated: true}
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

    
    this.courseData = data;
    this.courses = this.courseData["default"]["courses"];
    this.courseNums = Object.keys(this.courses)
    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    this.options = ["15-","18-","21-","36-","11-"];
    this.keywords = ["Theory","Distributed","Security","Finance","Programming","Parallel","Statistics","Probability"]

    
    
  }

  getCourseName(courseNum){
      return (courseNum in this.courses) ? this.courses[courseNum]['name'] : "None";
  }


  courseNumStartWith(item){
    for (const prefix of this.state.selected){
      if (item.includes(prefix)){
        return true;
      }
    }

    for (const prefix of this.state.specificCourses){
      if (item.includes(prefix)){
        return true;
      }
    }

    return false;
  }

  courseNameContains(item){
    for (const prefix of this.state.keyword){
      if (this.courses[item]['name'].includes(prefix)){
        return true;
      }
    }

    return false;
  }

  getChildren(item){
    let children = [];
    if (item in this.courses){

      if ((this.courses[item]['prereqs_obj']['reqs_list'])){
          children = (this.courses[item]['prereqs_obj']['reqs_list']).flat();
      } 
    } 
    
    return children.filter(child => (child in this.courses));
  }

  getDescendents(item){
    let descendents = new Set();
    let visited = new Set();
    let unvisited = [item];
    

    // arbitrary search
    while (unvisited.length > 0){
      let mostRecent = unvisited.pop();
      visited.add(mostRecent);
      let recentChildren = this.getChildren(mostRecent);

      for (const child of recentChildren){
        if (!visited.has(child)){
          unvisited.push(child);
        }

        descendents.add(child);
      }

    }

    return Array.from(descendents);
  }

  getSetDescendents(vertices){
    let allVertices = new Set(vertices);

    function union(setA, setB) {
      let _union = new Set(setA)
      for (let elem of setB) {
          _union.add(elem)
      }
      return _union
    }

    for (const vertex of vertices){
      let descendents = this.getDescendents(vertex);
      allVertices = union(allVertices,descendents);
    }

    console.log("descendents",vertices,allVertices);
    return Array.from(allVertices);

  }

  computeAllNodes(allNodes){
    let mainNodes = allNodes.filter(item => (this.courseNumStartWith(item) || this.courseNameContains(item)))
    let result = new Set(this.getSetDescendents(mainNodes));
    console.log("no repeat",result);
    return Array.from(result);
  }

   createNewNode(item,index){



      
        //this.setState({cyElements: this.state.cyElements.concat([{data: {id: item, name: this.getCourseName(item) }  }]),
                       //currentNodes:this.state.cyElements.concat([item]),
                      //updated: false});
      this.cyElements.push({data: {id: item, name: this.getCourseName(item) }  } );
      //this.currentNodes.push(item);
      //this.mainNodes.push(item);
      
  }


  addEdges(item,index){

      

      
      let children = this.getChildren(item);


      let generateEdge = (item2,index) => {
          if (this.currentNodes.includes(item2)){
              this.cyElements.push({data: {id: (item+" "+item2), source: item, target: item2 }  } );
              
              //this.setState({cyElements: this.state.cyElements.concat([{data: {id: (item+" "+item2), source: item, target: item2 }  }]),
                            //updated: false});
              
          }
          
      }

      children.forEach(generateEdge);
      
      
  }

  

  renderCytoscapeElement(){

    

    this.cyElements = [];
    this.currentNodes = [];
    this.mainNodes = [];

    console.log('* Cytoscape.js is rendering the graph..');

    this.currentNodes = this.computeAllNodes(Object.keys(this.courses))
    this.currentNodes.forEach(this.createNewNode);
    this.currentNodes.forEach(this.addEdges);
    

    



    this.setState({cyElements: this.cyElements,
      currentNodes: this.currentNodes,
      updated: true});

    this.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: this.cyElements,
      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': 'blue',
            'label': 'data(name)'
          }
        },
        {
          "selector": "edge",
          "style": {
            "width": 1,
            "curve-style": "bezier" 
          }
        },
    
        {
          "selector": 'edge[arrow]',
          "style": {
            
            'target-arrow-shape': 'triangle'
            
          }
        },
        {
          "selector": "edge.hollow",
          "style": {
            "target-arrow-fill": "hollow"
          }
        }
        
      ],
      
    layout: {
      name: 'concentric',

      fit: true, // whether to fit the viewport to the graph
      padding: 30, // the padding on fit
      startAngle: 3 / 2 * Math.PI, // where nodes start in radians
      sweep: undefined, // how many radians should be between the first and last node (defaults to full circle)
      clockwise: true, // whether the layout should go clockwise (true) or counterclockwise/anticlockwise (false)
      equidistant: false, // whether levels have an equal radial distance betwen them, may cause bounding box overflow
      minNodeSpacing: 10, // min spacing between outside of nodes (used for radius adjustment)
      boundingBox: undefined, // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
      avoidOverlap: true, // prevents node overlap, may overflow boundingBox if not enough space
      nodeDimensionsIncludeLabels: false, // Excludes the label when calculating node bounding boxes for the layout algorithm
      height: undefined, // height of layout area (overrides container height)
      width: undefined, // width of layout area (overrides container width)
      spacingFactor: undefined, // Applies a multiplicative factor (>0) to expand or compress the overall area that the nodes take up
      concentric: function( node ){ // returns numeric value for each node, placing higher nodes in levels towards the centre
      return node.degree();
      },
      levelWidth: function( nodes ){ // the variation of concentric values in each level
      return nodes.maxDegree() / 4;
      },
      animate: false, // whether to transition the node positions
      animationDuration: 500, // duration of animation in ms if enabled
      animationEasing: undefined, // easing of animation if enabled
      animateFilter: function ( node, i ){ return true; }, // a function that determines whether the node should be animated.  All nodes animated by default on animate enabled.  Non-animated nodes are positioned immediately when the layout starts
      ready: undefined, // callback on layoutready
      stop: undefined, // callback on layoutstop
      transform: function (node, position ){ return position; }
      }


    });

    console.log("over",this.state);


    


    
  }


  
  componentDidMount(){
    this.setState({w: window.innerWidth, h:window.innerHeight});
    this.renderCytoscapeElement();
    console.log("component mount",this.state);
    
  }

  componentDidUpdate(prevProps, prevState, snapshot){
    if ((prevState.specificCourses != this.state.specificCourses || prevState.selected != this.state.selected || prevState.keyword != this.state.keyword) && !this.state.updated){
      console.log("hello");
      this.renderCytoscapeElement();
      console.log(this.state);
    }
  }

  
  

  render(){
    //let el = document.getElementById("cy");
    //console.log(el);
    
    console.log(data); // output 'testing'



    let cyStyle = {
      height: this.state.h,
      width: this.state.w
    };
  
    return (
      <SplitPane split="vertical" minSize={400}>
        
        
        <SplitPane split="horizontal">
          <Typeahead
            clearButton
            defaultSelected={this.options}
            id="department-affiliation"
            labelKey="department"
            multiple
            options={this.options}
            placeholder="Choose a state..."
            onChange={(selected) => {
              this.setState({selected: selected, updated: false})
            }}
          />
          <SplitPane split="horizontal">
            <Typeahead
              clearButton
              defaultSelected={[]}
              id="course-name-keyword"
              labelKey="keyword"
              multiple
              options={this.keywords}
              placeholder="Choose a state..."
              onChange={(selected) => {
                this.setState({keyword: selected, updated: false})
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
                this.setState({specificCourses: selected, updated: false})
              }}
            />
          </SplitPane>
        </SplitPane>
        
        <div style={cyStyle} id="cy">
        </div>
      </SplitPane>
    );

    /*const elements = [
       { data: { id: 'one', label: 'Node 1' }, position: { x: 0, y: 0 } },
       { data: { id: 'two', label: 'Node 2' }, position: { x: 100, y: 0 } },
       { data: { source: 'one', target: 'two', label: 'Edge from Node1 to Node2' } }
    ]; */

    

    
  }
}



export default MyApp;