// Run on page load
window.onload = Init;

// Constant Values
const tableContainer = document.getElementById("tableContainer");
const tableSideLength = 15;

const startPosition = [0, 0];
const finishPosition = [tableSideLength - 1, tableSideLength - 1];

const pathingArray = [];

let currentTimeout = null;

function GenerateTable(){
    const table = document.createElement("table");
    table.draggable = false;

    for(let rowIndex = 0; rowIndex < tableSideLength; rowIndex++){

        const newRow = document.createElement("tr");
        const newArrayRow = [];

        for(let cellIndex = 0; cellIndex < tableSideLength; cellIndex++){

            const newCell = document.createElement("td");
            newCell.draggable = false;

            // Will use id to more easily confirm position in table
            newCell.id = `${rowIndex} ${cellIndex}`;

            if(rowIndex == startPosition[0] && cellIndex == startPosition[1]) newCell.classList.add("start");
            if(rowIndex == finishPosition[0] && cellIndex == finishPosition[1]) newCell.classList.add("finish");

            newRow.appendChild(newCell);
            newArrayRow.push({x: rowIndex, y: cellIndex, obstructed: false, f: 0, g: 0, cost: 0, parent: undefined});

            // Allow for cell to be drawn over
            newCell.addEventListener("click", () => DrawWall(rowIndex, cellIndex));
            newCell.addEventListener("mouseover", () => allowDrawing && DrawWall(rowIndex, cellIndex));
        }

        table.appendChild(newRow);
        pathingArray.push(newArrayRow);
    }

    tableContainer.appendChild(table);
}

function Init(){
    GenerateTable(tableSideLength);
}

// Event Listeners
let allowDrawing = false;

document.addEventListener("mousedown", () => allowDrawing = true);
document.addEventListener("mouseup", () => allowDrawing = false);

function DrawWall(x, y){
    document.getElementById(`${x} ${y}`).classList.toggle("wall");
    pathingArray[x][y].obstructed = !pathingArray[x][y].obstructed;
}

// A* Function
function StartPathfinding(){
    let openSet = [pathingArray[startPosition[0]][startPosition[1]]];
    let closedSet = [];
    AStarIteration(openSet, closedSet);
}

function AStarIteration(openSet, closedSet){    
    
    // Sort by asecnding values for f so the most viable nodes are in front
    openSet.sort((a,b)=> a.f - b.f)

    if(openSet.length === 0){
        console.log("No possible routes");
        //Signal no routes
        return;
    }

    // Grab most viable node based on f value
    let current = openSet[0];
    
    // Remove node from open set
    openSet.shift(); 

    // Add node to closed set
    closedSet.push(current);

    // Color all closed areas as white
    for(let index = 0; index < closedSet.length; index++){
        document.getElementById(`${closedSet[index].x} ${closedSet[index].y}`).classList.remove("path");
        document.getElementById(`${closedSet[index].x} ${closedSet[index].y}`).classList.add("closed");
    }

    // Front node colored
    document.getElementById(`${current.x} ${current.y}`).classList.add("path");
    
    // Store current node in a temp value so we can loop its parents
    let tempCurrent = current;

    // Backtrack through all parents and color them to show the current path
    while(tempCurrent.parent !== undefined){
        document.getElementById(`${tempCurrent.parent.x} ${tempCurrent.parent.y}`).className = document.getElementById(`${tempCurrent.parent.x} ${tempCurrent.parent.y}`).classList.contains("start") ? "start" : "";
        document.getElementById(`${tempCurrent.parent.x} ${tempCurrent.parent.y}`).classList.add("path");

        let angle = tempCurrent.x > tempCurrent.parent.x && tempCurrent.y > tempCurrent.parent.y ? 225 
           : tempCurrent.x < tempCurrent.parent.x && tempCurrent.y < tempCurrent.parent.y ? 45
           : tempCurrent.x === tempCurrent.parent.x && tempCurrent.y > tempCurrent.parent.y ? 90
           : tempCurrent.x > tempCurrent.parent.x && tempCurrent.y === tempCurrent.parent.y ? 180
           : tempCurrent.x < tempCurrent.parent.x && tempCurrent.y === tempCurrent.parent.y ? 0
           : tempCurrent.x === tempCurrent.parent.x && tempCurrent.y < tempCurrent.parent.y ? 270
           : null;

        
        document.getElementById(`${tempCurrent.parent.x} ${tempCurrent.parent.y}`).classList.add(`r${angle}`);

        tempCurrent = tempCurrent.parent;
    }

    // Color all nodes in open set
    openSet.forEach((element)=>{
        document.getElementById(`${element.x} ${element.y}`).classList.add("open");
    });

    // Check if end point is found
    if(current.x === finishPosition[0] && current.y === finishPosition[1] ){
        return;
    }

    // Get neighbor nodes
    let neighborNodes = FindNeighbors(current);
    
    // For neighbor nodes loop
    for(let index = 0; index < neighborNodes.length; index++){

        // Ignore if in closed set or is a wall
        if(neighborNodes[index].obstructed == true || closedSet.includes(neighborNodes[index])){
            continue;
        }

        // If not in open set or the cost to get to current square and then to neighbor square is less than the cost to neighbor sqaure, change points of neighbor
        // If node hasn't been explored or found a shorter path compute new values
        if(!openSet.includes(neighborNodes[index]) || current.cost + CostToMove(neighborNodes[index], current) < neighborNodes[index].cost){
            
            ComputePointValues(neighborNodes[index], current);
            
            // If it didnt have the node then add it to open set so it can be explored
            if(!openSet.includes(neighborNodes[index])){
                openSet.push(neighborNodes[index]);
            }
        }
    }
    currentTimeout = setTimeout(()=> AStarIteration(openSet, closedSet), 50);

}

// Generate all valid neighbors
function FindNeighbors(point){
    let neighborArray = [];
    
    const xMoves = [-1, 1, 0];
    const yMoves = [-1, 1, 0];

    for(xMove of xMoves){
        for(yMove of yMoves){
            if(xMove == 0 && yMove == 0) continue;
            
            let neighborX = point.x + xMove;
            let neighborY = point.y + yMove

            if(neighborX < 0 || neighborX > pathingArray.length - 1) continue;
            if(neighborY < 0 || neighborY > pathingArray.length - 1) continue;

            neighborArray.push(pathingArray[neighborX][neighborY]);    
        }
    }

    return neighborArray;
}

// Apply new calculations upon point
function ComputePointValues(point, current){
    point.parent = current;
    point.cost = current.cost + CostToMove(point, current);
    point.g = Heuristic(point);
    point.f = point.cost + point.g;
}

// Calculate cost to move where diagonal movement cost root 2 and non-diagonal movements costs 1
function CostToMove(point, current){
    return point.x !== current.x && point.y !== current.y ? Math.sqrt(2) : 1;
}

// Compute the distance between the current cell and the finish cell (to 2dp)
function Heuristic(point){
    return Math.round(Math.sqrt((point.x-finishPosition[0])**2+(point.y-finishPosition[1])**2)*10)/10;
}