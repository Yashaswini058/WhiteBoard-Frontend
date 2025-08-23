import { useState, useEffect } from "react";
import Toolbar from "../components/toolbar";
import Board from "../components/board";
import BoardProvider from "../store/BoardProvider";
import ToolboxProvider from "../store/ToolboxProvider";
import Toolbox from "../components/Toolbox";
import { userApi } from "../utils/api";
import { getStroke } from "perfect-freehand";
import { getSvgPathFromStroke } from "../utils/elements";
// import { v4 as uuid } from "uuid";
import { connectSocket, getSocket } from "../utils/socket";

function WhiteBoard() {
  const [boardData, setBoardData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boardId = window.location.pathname.split("/").pop();

    (async () => {
      try {
        const data = await userApi.loadBoard(boardId);

        // Store only SVG path string for brushes
        const processedElements =
          data.elements?.map((element) => {
            if (element.type === "BRUSH") {
              return {
                ...element,
                path: getSvgPathFromStroke(getStroke(element.points)),
              };
            }
            return element;
          }) || [];

        setBoardData({ ...data, elements: processedElements });
      } catch (err) {
        console.error("Failed to load board:", err);
        setError("Unable to load board. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token"); // if using JWT
    const s = connectSocket({ token });
    const boardId = window.location.pathname.split("/").pop();
    s.emit("board:join", { boardId });

    return () => {
      s.emit("board:leave", { boardId });
      s.off(); // remove all listeners
      s.disconnect();
    };
  }, []);

  if (loading) return <div>Loading board...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!boardData) return <div>No board found.</div>;

  return (
    <BoardProvider initialState={boardData}>
      <ToolboxProvider>
        <Toolbar />
        <Board />
        <Toolbox />
      </ToolboxProvider>
    </BoardProvider>
  );
}

export default WhiteBoard;
