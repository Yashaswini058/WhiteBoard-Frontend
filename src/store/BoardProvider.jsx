import React,{useReducer,useCallback, useEffect} from 'react'
import BoardContext from './board-context';
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from '../constants';
// import rough from "roughjs/bin/rough";
import { createRoughElement,getSvgPathFromStroke,isPointNearElement } from "../utils/elements";
// import toolboxContext from './toolbox-context';
import {  getStroke } from 'perfect-freehand';

const boardReducer=(state,action)=>{
    switch (action.type) {
        case BOARD_ACTIONS.LOAD_BOARD: {
            const raw = action.payload.elements || [];
            const cooked = raw.map((el, idx) => {
              // Rebuild BRUSH path
              if (el.type === TOOL_ITEMS.BRUSH) {
                return {
                  id: el.id ?? idx,
                  ...el,
                  // Path2D must be rebuilt client-side for rendering
                  path: new Path2D(getSvgPathFromStroke(getStroke(el.points || []))),
                };
              }
              // Rebuild rough element for geometric shapes
              if (
              el.type === TOOL_ITEMS.LINE ||
              el.type === TOOL_ITEMS.RECTANGLE ||
              el.type === TOOL_ITEMS.CIRCLE ||
              el.type === TOOL_ITEMS.ARROW
            ) {
              const { x1, y1, x2, y2, stroke, fill, size } = el;
              return createRoughElement(
                el.id ?? idx,
                x1, y1, x2, y2,
                { type: el.type, stroke, fill, size }
              );
            }
            // TEXT or anything else just passes through
            return { id: el.id ?? idx, ...el };
          });
          return {
            ...state,
            elements: cooked,
            history: [cooked],
            index: 0,
          };
        }
        case BOARD_ACTIONS.CHANGE_TOOL: {
            return {
                ...state,
                activeToolItem: action.payload.tool,
            };
        }
        case BOARD_ACTIONS.CHANGE_ACTION_TYPE: {
            return {    
                ...state,
                toolActionType: action.payload.actionType,
            };
        }
        case BOARD_ACTIONS.DRAW_DOWN: {
            const {clientX,clientY,stroke,fill,size}=action.payload;
            const newElement = createRoughElement(
                    state.elements.length,
                    clientX,
                    clientY,
                    clientX,
                    clientY,
                    { type: state.activeToolItem ,stroke,fill,size}
                );
            const prevElements=state.elements;
            return{
                ...state,
                toolActionType: 
                state.activeToolItem=== TOOL_ITEMS.TEXT?TOOL_ACTION_TYPES.WRITING  :TOOL_ACTION_TYPES.DRAWING,
                elements:[...prevElements,newElement],
            };
        }
        case BOARD_ACTIONS.DRAW_MOVE: {
            const { clientX, clientY } = action.payload;
            const newElements = [...state.elements];
            const index = state.elements.length - 1;
            const { type } = newElements[index];
            switch (type) {
                case TOOL_ITEMS.LINE:
                case TOOL_ITEMS.RECTANGLE:
                case TOOL_ITEMS.CIRCLE:
                case TOOL_ITEMS.ARROW:{
                    const { x1, y1, stroke, fill, size } = newElements[index];
                    const newElement = createRoughElement(
                        index,
                        x1,
                        y1,
                        clientX,
                        clientY,
                        {
                        type: state.activeToolItem,
                        stroke,
                        fill,
                        size,
                        }
                    );
                    newElements[index] = newElement;
                    return {
                        ...state,
                        elements: newElements,
                    };
                }   
                case TOOL_ITEMS.BRUSH:{
                    newElements[index].points = [
                        ...newElements[index].points,
                        { x: clientX, y: clientY },
                    ];
                    newElements[index].path = new Path2D(
                        getSvgPathFromStroke(getStroke(newElements[index].points))
                    );
                    return {
                        ...state,
                        elements: newElements,
                    };
                }
                default:
                throw new Error("Type not recognized");
            }
        }

        case BOARD_ACTIONS.ERASE:{
            const { clientX, clientY } = action.payload;
            let newElements = [...state.elements];
            newElements = newElements.filter((element) => {
                return !isPointNearElement(element, clientX, clientY);
            });
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(newElements);
            return{
                ...state,
                elements: newElements,
                history: newHistory,
                index: state.index + 1,
            }
        }
        case BOARD_ACTIONS.CHANGE_TEXT: {
            const index = state.elements.length - 1;
            const newElements = [...state.elements];
            newElements[index].text = action.payload.text;
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(newElements);
            return {
                ...state,
                toolActionType: TOOL_ACTION_TYPES.NONE,
                elements: newElements,
                history: newHistory,
                index: state.index + 1, 
            };
        }
        case BOARD_ACTIONS.DRAW_UP: {
            const elementsCopy = [...state.elements];
            const newHistory =state.history.slice(0, state.index + 1);
            newHistory.push(elementsCopy);
            return{
                ...state,
                history: newHistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.UNDO: {
            if (state.index <= 0) return state;
            const newIndex = state.index - 1;
            return {
                ...state,
                elements: state.history[newIndex],
                index: newIndex,
            };
        }
        case BOARD_ACTIONS.REDO: {
            if (state.index >= state.history.length - 1) return state;
            const newIndex = state.index + 1;
            return {
                ...state,
                elements: state.history[newIndex],
                index: newIndex,
            };
        }
        default:
            return state;
    }
}


const BoardProvider = ({initialState,children}) => {
    const initialBoardState={
        activeToolItem: TOOL_ITEMS.BRUSH,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: initialState?.elements || [],
        history: [initialState?.elements || []],
        index: 0,
    }

    useEffect(() => {
        if (initialState?.elements) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.LOAD_BOARD,
                payload: { elements: initialState.elements },
            });
        }
    }, [initialState?.elements]);

    const [boardState, dispatchBoardAction] = useReducer(boardReducer,initialBoardState);
    const changeToolHandler = (tool) => {
        dispatchBoardAction({type: "CHANGE_TOOL", payload: {tool}}); 
    };
    const boardMouseDownHandler=(event,toolboxState)=>{
        const {clientX, clientY} = event;
             if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
            if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
                dispatchBoardAction({
                    type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
                    payload: {
                    actionType: TOOL_ACTION_TYPES.ERASING,
                    },
                });
            return;
        }
        dispatchBoardAction({
            type : BOARD_ACTIONS.DRAW_DOWN,
            payload : {
                clientX,
                clientY,
                stroke: toolboxState[boardState.activeToolItem]?.stroke,
                fill: toolboxState[boardState.activeToolItem]?.fill,
                size: toolboxState[boardState.activeToolItem]?.size,
            },
        });
    };
    const boardMouseMoveHandler=(event)=>{
        const {clientX, clientY} = event;
        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
        if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.DRAW_MOVE,
                payload: {
                clientX,
                clientY,
                },
            });
        } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.ERASE,
                payload: {
                clientX,
                clientY,
                },
            });
        }
    };
    const boardMouseUpHandler=()=>{
        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;
        if (boardState.toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.DRAW_UP,
            });
        } else if (boardState.toolActionType === TOOL_ACTION_TYPES.ERASING) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.ERASE,
            });
        }
        dispatchBoardAction({
            type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
            payload: {
                actionType: TOOL_ACTION_TYPES.NONE,
            },
        });
    };

    const boardUndoHandler = useCallback(() => {
        dispatchBoardAction({
            type: BOARD_ACTIONS.UNDO,
        });
    },[]);
    
    const boardRedoHandler = useCallback(() => {
        dispatchBoardAction({
            type: BOARD_ACTIONS.REDO,
        });
    },[]);

    const textAreaBlurHandler = (text) => {
        dispatchBoardAction({
        type: BOARD_ACTIONS.CHANGE_TEXT,
        payload: {
            text,
        },
        });
    };

    const boardContextValue = {
        activeToolItem : boardState.activeToolItem,
        elements: boardState.elements,
        toolActionType: boardState.toolActionType,
        changeToolHandler ,
        boardMouseDownHandler,
        boardMouseMoveHandler,
        boardMouseUpHandler,
        textAreaBlurHandler,
        undo :boardUndoHandler,
        redo :boardRedoHandler,
    };
    return (
        <BoardContext.Provider
        value={boardContextValue}
            >
                {children}
        </BoardContext.Provider>
    );
    };

export default BoardProvider