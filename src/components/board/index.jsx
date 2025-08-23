import React, { useEffect, useRef, useContext, useLayoutEffect } from "react";
import rough from "roughjs";
import boardContext from "../../store/board-context";
import { TOOL_ACTION_TYPES, TOOL_ITEMS } from "../../constants";
import toolboxContext from "../../store/toolbox-context";
import classes from "./index.module.css";
import { getSocket } from "../../utils/socket";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "../../utils/elements";

function Board() {
  const canvasRef = useRef();
  const textAreaRef = useRef();
  const {
    elements,
    boardMouseDownHandler,
    boardMouseMoveHandler,
    boardMouseUpHandler,
    toolActionType,
    textAreaBlurHandler,
    undo,
    redo,
    editingElement,
  } = useContext(boardContext);
  const { toolboxState } = useContext(toolboxContext);

  // HiDPI-safe canvas init
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, []);

  // Undo/Redo hotkeys
  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      if (event.ctrlKey && key === "z") {
        undo();
      } else if (event.ctrlKey && key === "y") {
        redo();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Draw loop
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rc = rough.canvas(canvas);

    // Clear before redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    elements.forEach((element) => {
      switch (element.type) {
        case TOOL_ITEMS.LINE: {
          if (element.roughEle) {
            rc.draw(element.roughEle);
          } else {
            const { x1, y1, x2, y2, stroke, size } = element;
            rc.line(x1, y1, x2, y2, {
              stroke: stroke,
              strokeWidth: size,
            });
          }
          break;
        }

        case TOOL_ITEMS.RECTANGLE: {
          if (element.roughEle) {
            rc.draw(element.roughEle);
          } else {
            const { x1, y1, x2, y2, stroke, fill, size } = element;
            rc.rectangle(
              Math.min(x1, x2),
              Math.min(y1, y2),
              Math.abs(x2 - x1),
              Math.abs(y2 - y1),
              {
                stroke,
                fill,
                strokeWidth: size,
                fillStyle: fill ? "solid" : undefined,
              }
            );
          }
          break;
        }

        case TOOL_ITEMS.CIRCLE: {
          if (element.roughEle) {
            rc.draw(element.roughEle);
          } else {
            const { x1, y1, x2, y2, stroke, fill, size } = element;
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2;
            const w = Math.abs(x2 - x1);
            const h = Math.abs(y2 - y1);
            rc.ellipse(cx, cy, w, h, {
              stroke,
              fill,
              strokeWidth: size,
              fillStyle: fill ? "solid" : undefined,
            });
          }
          break;
        }

        case TOOL_ITEMS.ARROW: {
          // Fallback: draw as a line if roughEle not present
          if (element.roughEle) {
            rc.draw(element.roughEle);
          } else {
            const { x1, y1, x2, y2, stroke, size } = element;
            rc.line(x1, y1, x2, y2, { stroke, strokeWidth: size });
            // If you have custom arrowheads, draw them here with ctx.
          }
          break;
        }

        case TOOL_ITEMS.BRUSH: {
          ctx.save();
          ctx.fillStyle = element.stroke || "#000";

          // element.path may be:
          // - a string (preferred, from DB/state)
          // - a Path2D (during active drawing)
          // - missing → rebuild from points
          let path2D = null;

          if (typeof element.path === "string") {
            path2D = new Path2D(element.path);
          } else if (element.path instanceof Path2D) {
            path2D = element.path;
          } else if (element.points?.length) {
            const pathStr = getSvgPathFromStroke(getStroke(element.points));
            path2D = new Path2D(pathStr);
          }

          if (path2D) ctx.fill(path2D);
          ctx.restore();
          break;
        }

        case TOOL_ITEMS.TEXT: {
          ctx.save();
          ctx.textBaseline = "top";
          ctx.font = `${element.size}px Caveat`;
          ctx.fillStyle = element.stroke || "#000";
          ctx.fillText(element.text ?? "", element.x1, element.y1);
          ctx.restore();
          break;
        }

        default:
          throw new Error("Type not recognized");
      }
    });
  }, [elements]);

  // Focus textarea when writing
  useEffect(() => {
    const textarea = textAreaRef.current;
    if (toolActionType === TOOL_ACTION_TYPES.WRITING && textarea) {
      setTimeout(() => textarea.focus(), 0);
    }
  }, [toolActionType]);

  const handleMouseDown = (event) => {
    boardMouseDownHandler(event, toolboxState);
  };

  const handleMouseUp = () => {
    boardMouseUpHandler();
    // const boardId = window.location.pathname.split("/").pop();
    // Persist only serializable fields
    // const persistable = elements.map(({ path, roughEle, ...rest }) => rest);
    // userApi.updateBoard(boardId, { elements: persistable });
  };

  const handleMouseMove = (event) => {
    boardMouseMoveHandler(event);
    const socket = getSocket();
    const boardId = window.location.pathname.split("/").pop();
    socket?.emit("cursor", {
      boardId,
      x: event.clientX,
      y: event.clientY,
      color: toolboxState.cursorColor,
      name: toolboxState.displayName,
    });
  };

  return (
    <>
      {toolActionType === TOOL_ACTION_TYPES.WRITING && editingElement && (
        <textarea
          ref={textAreaRef}
          className={classes.textElementBox}
          style={{
            top: editingElement.y1,
            left: editingElement.x1,
            fontSize: `${editingElement.size}px`,
            color: editingElement.stroke,
          }}
          onBlur={(event) => textAreaBlurHandler(event.target.value)}
        />
      )}
      <canvas
        ref={canvasRef}
        id="canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  );
}

export default Board;
