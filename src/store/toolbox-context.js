import { createContext } from "react";  
const toolboxContext = createContext({
    toolboxState: {},
    dispatchToolboxAction: () => {},
    changeStroke: () => {},
    changeFill: () => {},
});
export default toolboxContext;