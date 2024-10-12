import { createContext, useState } from "react";
import run from "../config/gemini";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("")
  const [recentPrompt, setRecentPrompt] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resultData, setResultData] = useState("")
  const [prevPrompts,setPrevPrompts] = useState([])

  const delayPara = (index, nextWord) => {
    setTimeout(function() {
      setResultData(prev => [...prev, nextWord])
    }, 75 * index);
  }

  const onSent = async () => {
    setResultData([])
    setLoading(true)
    setShowResult(true)
    setRecentPrompt(input)
    setPrevPrompts(prev => [...prev,input])
    const response = await run(input)

    // Parse the response and convert to React elements
    let parsedResponse = parseResponse(response);
    
    // Animate the appearance of each element
    parsedResponse.forEach((element, index) => {
      delayPara(index, element);
    });

    setLoading(false)
    setInput("")
  }

  const parseResponse = (text) => {
    const lines = text.split('\n');
    let inList = false;
    return lines.reduce((acc, line, index) => {
      if (line.trim() === '') {
        // Empty line, end any ongoing list
        if (inList) {
          acc.push(<ul key={`ul-${index}`}>{inList}</ul>);
          inList = false;
        }
        return acc;
      }

      if (line.startsWith('* ')) {
        // Handle bullet points
        const bulletContent = parseFormattedText(line.slice(2));
        if (!inList) inList = [];
        inList.push(<li key={`li-${index}`}>{bulletContent}</li>);
      } else {
        // Regular text
        if (inList) {
          acc.push(<ul key={`ul-${index}`}>{inList}</ul>);
          inList = false;
        }
        acc.push(<p key={`p-${index}`}>{parseFormattedText(line)}</p>);
      }

      return acc;
    }, []);
  }

  const parseFormattedText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={index}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

  const contextValue = {
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    prevPrompts,
    setPrevPrompts
  }

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  )
}

export default ContextProvider
