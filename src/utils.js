export const DisplayStyle = {
    ROOTS: "1",
    CHILDREN: "2",
};

Object.freeze(DisplayStyle);


function getCourseName(courseNum, courses) {
    return (courseNum in courses) ? courses[courseNum]['name'] : "None";
}


function courseNumStartWith(item, selected, specificCourses) {
    for (const prefix of selected) {
        if (item.includes(prefix)) {
            return true;
        }
    }

    for (const prefix of specificCourses) {
        if (item.includes(prefix)) {
            return true;
        }
    }

    return false;
}

function courseNameContains(item, courses, keyword) {
    for (const prefix of keyword) {
        if (courses[item]['name'].includes(prefix)) {
            return true;
        }
    }

    return false;
}

function getChildren(item, courses) {
    let children = [];
    if (item in courses) {

        if ((courses[item]['prereqs_obj']['reqs_list'])) {
            children = (courses[item]['prereqs_obj']['reqs_list']).flat();
        }
    }

    return children.filter(child => (child in courses));
}

function getParents(item, courses) {
    let parents = [];
    if (item in courses) {

        const courseKeys = Object.keys(courses);

        courseKeys.filter(key => ((key in courses) && courses[key]['prereqs_obj']['reqs_list']))
            .forEach((key) => {

                const keyChildren = (courses[key]['prereqs_obj']['reqs_list']).flat()
                keyChildren.forEach((possibleParentChild) => {
                                            if (possibleParentChild === item){
                                                parents.push(key);
                                            }
                                        });  
            })
    }

    return parents;
}

function getChildrenLogic(item, courses) {
    let children = [];
    if (item in courses) {

        if ((courses[item]['prereqs_obj']['reqs_list'])) {
            children = (courses[item]['prereqs_obj']['reqs_list']).map(childlist => childlist.filter(child => (child in courses)));
        }
    }

    return children;
}


function getDescendents(item, courses) {
    let descendents = new Set();
    let visited = new Set();
    let unvisited = [item];


    // arbitrary search
    while (unvisited.length > 0) {
        let mostRecent = unvisited.pop();
        visited.add(mostRecent);
        let recentChildren = getChildren(mostRecent, courses);

        for (const child of recentChildren) {
            if (!visited.has(child)) {
                unvisited.push(child);
            }

            descendents.add(child);
        }

    }

    return Array.from(descendents);
}

function getAncestors(item, courses) {
    let ancestors = new Set();
    let visited = new Set();
    let unvisited = [item];


    // arbitrary search
    while (unvisited.length > 0) {
        let mostRecent = unvisited.pop();
        visited.add(mostRecent);
        let recentParent = getParents(mostRecent, courses);

        for (const parent of recentParent) {
            if (!visited.has(parent)) {
                unvisited.push(parent);
            }

            ancestors.add(parent);
        }

    }

    return Array.from(ancestors);
}

function union(setA, setB) {
    let _union = new Set(setA)
    for (let elem of setB) {
        _union.add(elem)
    }
    return _union
}

function getSetDescendents(vertices, courses) {
    let allVertices = new Set(vertices);



    for (const vertex of vertices) {
        let descendents = getDescendents(vertex, courses);
        allVertices = union(allVertices, descendents);
    }

    return Array.from(allVertices);

}

function getSetAncestors(vertices, courses) {
    let allVertices = new Set(vertices);

    for (const vertex of vertices) {
        let ancestors = getAncestors(vertex, courses);
        allVertices = union(allVertices, ancestors);
    }

    return Array.from(allVertices);

}

export const computeAllNodes = (allNodes, displayStyle, courses, selected, specificCourses, keyword) => {

    let mainNodes = allNodes.filter(item =>
    (courseNumStartWith(item, selected, specificCourses) ||
        courseNameContains(item, courses, keyword)))

    let result = (displayStyle == DisplayStyle.ROOTS) ?
        new Set(getSetDescendents(mainNodes, courses)) :
        new Set(getSetAncestors(mainNodes, courses));


    return Array.from(result);
}

export const createNewNode = (cyElements, specificCourses, selectedNode, courses) => (item) => {

    let color = "blue";

    if (specificCourses.includes(item)) {
        color = "orange";
    } else if (selectedNode === item) {
        color = "red";
    }

    cyElements.push({ data: { id: item, name: getCourseName(item, courses), color: color } });

}

function generateRandomColor(n) {

    let colorList = ["#273746",
        "#3498DB",
        "#229954",
        "#C70039",
        "#8E44AD",
        "#F39C12",
    ]
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

function randomColor() {
    return '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6);
}

export const addEdges = (cyElements, currentNodes, courses, displayStyle) => (item) => {

    let generateEdge = (color) => (item2) => {
        if (currentNodes.includes(item2)) {
            cyElements.push({ data: { id: (item + " " + item2), source: item, target: item2, arrow: "triangle", color: color } });
        }
    }

    let generateEdgeSet = (colorList) => (childList, index) => {
        childList.forEach(generateEdge(colorList[index]));
    }

    if (displayStyle == DisplayStyle.ROOTS) {

        let children = getChildrenLogic(item, courses);
        let numColor = children.length;
        let colorList = generateRandomColor(numColor);

        children.forEach(generateEdgeSet(colorList));

    } else {

        let ancestors = getAncestors(item, courses);
        let edgeColor = generateRandomColor(1)[0];

        ancestors.forEach(generateEdge(edgeColor));

    }


}