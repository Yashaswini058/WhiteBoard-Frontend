import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import { v4 as uuid } from "uuid";
import BoardContext from './board-context';
import { BOARD_ACTIONS, TOOL_ACTION_TYPES, TOOL_ITEMS } from '../constants';
import { createRoughElement, getSvgPathFromStroke, isPointNearElement } from "../utils/elements";
import { getStroke } from 'perfect-freehand';
import { getSocket } from '../utils/socket';

// The reducer is now a pure function with no side effects.
const boardReducer = (state, action) => {
    switch (action.type) {
        case BOARD_ACTIONS.LOAD_BOARD: {
            const raw = action.payload.elements || [];
            const cooked = raw.map((el, idx) => {
                if (el.type === TOOL_ITEMS.BRUSH) {
                    return {
                        id: el.id ?? idx,
                        ...el,
                        path: new Path2D(getSvgPathFromStroke(getStroke(el.points || []))),
                    };
                }
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
            const { newElement } = action.payload;
            const isTextElement = newElement.type === TOOL_ITEMS.TEXT;
            return {
                ...state,
                editingElement: isTextElement ? newElement : null, // This part is new
                toolActionType: isTextElement ? TOOL_ACTION_TYPES.WRITING : TOOL_ACTION_TYPES.DRAWING,
                elements: [...state.elements, newElement],
            };
        }
        case BOARD_ACTIONS.DRAW_MOVE: {
            const { clientX, clientY } = action.payload;
            const newElements = [...state.elements];
            const index = state.elements.length - 1;
            const currentElement = newElements[index];

            if (!currentElement) return state; // Should not happen, but safe guard

            const { type } = currentElement;

            switch (type) {
                case TOOL_ITEMS.LINE:
                case TOOL_ITEMS.RECTANGLE:
                case TOOL_ITEMS.CIRCLE:
                case TOOL_ITEMS.ARROW: {
                    const { x1, y1, stroke, fill, size, id } = currentElement;
                    const newElement = createRoughElement(
                        id, x1, y1, clientX, clientY,
                        { type, stroke, fill, size }
                    );
                    newElements[index] = newElement;
                    return { ...state, elements: newElements };
                }
                case TOOL_ITEMS.BRUSH: {
                    newElements[index].points = [...newElements[index].points, { x: clientX, y: clientY }];
                    newElements[index].path = new Path2D(getSvgPathFromStroke(getStroke(newElements[index].points)));
                    return { ...state, elements: newElements };
                }
                default:
                    return state;
            }
        }
        case BOARD_ACTIONS.DRAW_UP: {
            const elementsCopy = [...state.elements];
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(elementsCopy);
            return {
                ...state,
                history: newHistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.ERASE: {
            const { elementIds } = action.payload;
            const newElements = state.elements.filter(el => !elementIds.includes(el.id));
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(newElements);
            return {
                ...state,
                elements: newElements,
                history: newHistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.CHANGE_TEXT: {
            const { text, elementId } = action.payload;
            const newElements = state.elements.map(el =>
                el.id === elementId ? { ...el, text: text } : el
            );

            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(newElements);
            return {
                ...state,
                editingElement: null, // Clear the editing element
                toolActionType: TOOL_ACTION_TYPES.NONE,
                elements: newElements,
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
        // ... (All REMOTE_* cases remain the same)
        case BOARD_ACTIONS.REMOTE_START: {
            const { tempId, element } = action.payload;
            return {
                ...state,
                elements: [...state.elements, { ...element, id: tempId }],
            };
            }
        case BOARD_ACTIONS.REMOTE_POINTS: {
            const { tempId, pointsChunk } = action.payload;
            const els = state.elements.map((e) =>
                e.id === tempId
                ? { ...e, points: [...(e.points || []), ...pointsChunk] }
                : e
            );
            return { ...state, elements: els };
        }
        case BOARD_ACTIONS.REMOTE_UPDATE: {
            const { tempId, patch } = action.payload;
            const els = state.elements.map((e) =>
                e.id === tempId ? { ...e, ...patch } : e
            );
            return { ...state, elements: els };
        }
        case BOARD_ACTIONS.REMOTE_COMMIT: {
            const { tempId, finalId, element } = action.payload;
            let els = state.elements;
            if (els.find(e => e.id === tempId)) {
                els = els.map((e) =>
                e.id === tempId ? { ...element, id: finalId } : e
                );
            } else {
                els = [...els, { ...element, id: finalId }];
            }
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(els);
            return {
                ...state,
                elements: els,
                history: newHistory,
                index: state.index + 1,
            };
        }
        case BOARD_ACTIONS.REMOTE_ERASE: {
            const { elementIds } = action.payload;
            const els = state.elements.filter((e) => !elementIds.includes(e.id));
            const newHistory = state.history.slice(0, state.index + 1);
            newHistory.push(els);
            return { ...state, elements: els, history: newHistory, index: state.index + 1 };
        }
        default:
            return state;
    }
};

const BoardProvider = ({ initialState, children }) => {
    const initialBoardState = {
        activeToolItem: TOOL_ITEMS.BRUSH,
        toolActionType: TOOL_ACTION_TYPES.NONE,
        elements: [],
        history: [[]],
        editingElement: null, 
        index: 0,
    };

    const [boardState, dispatchBoardAction] = useReducer(boardReducer, initialBoardState);
    const erasedElementsRef = useRef(new Set());

    useEffect(() => {
        if (initialState?.elements) {
            dispatchBoardAction({
                type: BOARD_ACTIONS.LOAD_BOARD,
                payload: { elements: initialState.elements },
            });
        }
    }, [initialState?.elements]);
    
    // ... (Socket listener useEffect remains the same, but with one fix for REMOTE_UPDATE payload)
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;
        
        socket.on("element:start", ({ tempId, element }) => {
            dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_START, payload: { tempId, element } });
        });
        socket.on("element:points", ({ tempId, pointsChunk }) => {
            dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_POINTS, payload: { tempId, pointsChunk } });
        });
        socket.on("element:update", ({ tempId, patch }) => {
            dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_UPDATE, payload: { tempId, patch } });
        });
        socket.on("element:commit", ({ tempId, finalId, element }) => {
            dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_COMMIT, payload: { tempId, finalId, element } });
        });
        socket.on("element:erase", ({ elementIds }) => {
            dispatchBoardAction({ type: BOARD_ACTIONS.REMOTE_ERASE, payload: { elementIds } });
        });
        // ... other listeners ...

        return () => {
            // ... cleanup ...
        };
    }, []);


    const changeToolHandler = (tool) => {
        dispatchBoardAction({ type: BOARD_ACTIONS.CHANGE_TOOL, payload: { tool } });
    };

    const boardMouseDownHandler = (event, toolboxState) => {
        if (boardState.toolActionType === TOOL_ACTION_TYPES.WRITING) return;

        if (boardState.activeToolItem === TOOL_ITEMS.ERASER) {
            erasedElementsRef.current.clear();
            dispatchBoardAction({
                type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
                payload: { actionType: TOOL_ACTION_TYPES.ERASING },
            });
            return;
        }

        const { clientX, clientY } = event;
        const socket = getSocket();
        const boardId = window.location.pathname.split("/").pop();
        const tempId = uuid();
        const newElement = createRoughElement(
            tempId, clientX, clientY, clientX, clientY,
            {
                type: boardState.activeToolItem,
                stroke: toolboxState[boardState.activeToolItem]?.stroke,
                fill: toolboxState[boardState.activeToolItem]?.fill,
                size: toolboxState[boardState.activeToolItem]?.size,
            }
        );

        socket?.emit("element:start", {
            boardId,
            tempId,
            element: { ...newElement, path: undefined, roughEle: undefined },
        });

        dispatchBoardAction({
            type: BOARD_ACTIONS.DRAW_DOWN,
            payload: { newElement },
        });
    };

    const boardMouseMoveHandler = (event) => {
        const { clientX, clientY } = event;
        const { toolActionType, elements, activeToolItem } = boardState;

        if (toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            const socket = getSocket();
            const boardId = window.location.pathname.split("/").pop();
            const elementInProgress = elements[elements.length - 1];

            if (elementInProgress) {
                switch (activeToolItem) {
                    case TOOL_ITEMS.LINE:
                    case TOOL_ITEMS.RECTANGLE:
                    case TOOL_ITEMS.CIRCLE:
                    case TOOL_ITEMS.ARROW:
                        socket?.emit("element:update", {
                            boardId,
                            tempId: elementInProgress.id,
                            patch: { x2: clientX, y2: clientY },
                        });
                        break;
                    case TOOL_ITEMS.BRUSH:
                        const lastPoint = { x: clientX, y: clientY };
                        socket?.emit("element:points", {
                            boardId,
                            tempId: elementInProgress.id,
                            pointsChunk: [lastPoint],
                        });
                        break;
                    default: break;
                }
            }
            dispatchBoardAction({
                type: BOARD_ACTIONS.DRAW_MOVE,
                payload: { clientX, clientY },
            });

        } else if (toolActionType === TOOL_ACTION_TYPES.ERASING) {
            const elementsUnderCursor = boardState.elements.filter(el =>
                isPointNearElement(el, clientX, clientY)
            );
            elementsUnderCursor.forEach(el => erasedElementsRef.current.add(el.id));
        }
    };

    const boardMouseUpHandler = () => {
        const { toolActionType, elements } = boardState;
        const socket = getSocket();
        const boardId = window.location.pathname.split("/").pop();

        if (toolActionType === TOOL_ACTION_TYPES.DRAWING) {
            const lastElement = elements[elements.length - 1];
            if (lastElement) {
                const { path, roughEle, ...persistable } = lastElement;
                socket?.emit("element:commit", {
                    boardId,
                    tempId: lastElement.id,
                    element: persistable,
                });
            }
            dispatchBoardAction({ type: BOARD_ACTIONS.DRAW_UP });
        } else if (toolActionType === TOOL_ACTION_TYPES.ERASING) {
            const elementIds = Array.from(erasedElementsRef.current);
            if (elementIds.length > 0) {
                socket?.emit("element:erase", { boardId, elementIds });
                dispatchBoardAction({
                    type: BOARD_ACTIONS.ERASE,
                    payload: { elementIds },
                });
            }
            erasedElementsRef.current.clear();
        }

        dispatchBoardAction({
            type: BOARD_ACTIONS.CHANGE_ACTION_TYPE,
            payload: { actionType: TOOL_ACTION_TYPES.NONE },
        });
    };

    const textAreaBlurHandler = (text) => {
        const { elements } = boardState;
        const lastElement = elements[elements.length - 1];
        const { editingElement } = boardState; // Use the tracked element

        if (editingElement) {
            const socket = getSocket();
            if (lastElement && lastElement.type === TOOL_ITEMS.TEXT) {
                const socket = getSocket();
                const boardId = window.location.pathname.split("/").pop();
                const updatedElement = { ...lastElement, text };
                const { path, roughEle, ...persistable } = updatedElement;
                socket?.emit("element:commit", {
                    boardId,
                    tempId: lastElement.id,
                    element: persistable,
                });
            }

            // Dispatch with the specific element's ID
            dispatchBoardAction({
                type: BOARD_ACTIONS.CHANGE_TEXT,
                payload: {
                    text,
                    elementId: editingElement.id 
                },
            });
        }
    };

    const boardUndoHandler = useCallback(() => {
        // Note: Undo/Redo are local. Making them collaborative is much more complex.
        dispatchBoardAction({ type: BOARD_ACTIONS.UNDO });
    }, []);

    const boardRedoHandler = useCallback(() => {
        dispatchBoardAction({ type: BOARD_ACTIONS.REDO });
    }, []);
    
    const boardContextValue = {
        activeToolItem: boardState.activeToolItem,
        elements: boardState.elements,
        toolActionType: boardState.toolActionType,
        editingElement: boardState.editingElement,
        changeToolHandler,
        boardMouseDownHandler,
        boardMouseMoveHandler,
        boardMouseUpHandler,
        textAreaBlurHandler,
        undo: boardUndoHandler,
        redo: boardRedoHandler,
    };

    return (
        <BoardContext.Provider value={boardContextValue}>
            {children}
        </BoardContext.Provider>
    );
};

export default BoardProvider;