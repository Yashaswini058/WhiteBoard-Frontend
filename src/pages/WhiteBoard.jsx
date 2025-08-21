import Toolbar from '../components/toolbar';
import Board from '../components/board';
import BoardProvider from '../store/BoardProvider';
import ToolboxProvider from '../store/ToolboxProvider';
import Toolbox from '../components/Toolbox';

function WhiteBoard() {
  return (
    <BoardProvider>
      <ToolboxProvider>
        <Toolbar />
        <Board />
        <Toolbox />
    </ToolboxProvider>
    </BoardProvider>
  )
}

export default WhiteBoard