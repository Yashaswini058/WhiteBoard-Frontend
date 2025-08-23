import { createContext } from "react";
const boardContext = createContext({
    activeToolItem: "",
    elements: [],
    history: [[]],
    index: 0,
    toolActionType: "",
    editingElement: "",
    boardMouseDownHandler: ()=>{},
    changeToolHandler: ()=>{},
    boardMouseMoveHandler: ()=>{},
    boardMouseUpHandler: ()=>{},
})
export default boardContext;