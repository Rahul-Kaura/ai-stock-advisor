import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Typography, TextField, IconButton, Paper, List, ListItem, ListItemText, ListItemAvatar, Avatar } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4CAF50',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

const ALPHA_VANTAGE_API_KEY = 'OOPIZLORS9B08GN4';
const ALL_STOCK_SYMBOLS = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "BRK.B", "TSLA", "UNH", "JNJ",
    "JPM", "V", "PG", "MA", "HD", "CVX", "MRK", "ABBV", "PFE", "KO",
    "BAC", "PEP", "COST", "TMO", "DHR", "CSCO", "VZ", "ADBE", "CRM", "NEE",
    "CMCSA", "INTC", "WMT", "QCOM", "DIS", "NFLX", "AMD", "PM", "UPS", "IBM",
    "RTX", "MMM", "SBUX", "BA", "CAT", "GE", "F", "GM", "UBER", "LYFT"
];
const STOCKS_PER_VIEW = 9;
const API_ENDPOINT = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const welcomeShown = useRef(false);
  const defaultAvatar = "./gpt_logo.png";
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [showStockWidget, setShowStockWidget] = useState(false);
  const [currentStocks, setCurrentStocks] = useState([]);
  const [stockIndex, setStockIndex] = useState(0);
  const [isStockMode, setIsStockMode] = useState(true);
  const [context, setContext] = useState('stock');
  const stockDataRef = useRef({}); // Cache for stock data

  useEffect(() => {
    if (!welcomeShown.current) {
      setMessages([{
        text: isStockMode 
          ? 'Welcome to Stock Market Advisor! I can help you with stock analysis, market trends, and investment strategies. What would you like to know?'
          : 'Welcome to General AI Assistant! I can help you with any questions you have. What would you like to know?',
        sender: 'ai',
        avatar: defaultAvatar
      }]);
      welcomeShown.current = true;
    }
    // Fetch real stock prices initially and then every 30 seconds
    if (isStockMode) {
      generateStockPrices();
      const interval = setInterval(generateStockPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [isStockMode]);

  // Add new effect for cycling through stocks
  useEffect(() => {
    if (showStockWidget) {
      const cycleInterval = setInterval(() => {
        setStockIndex((prevIndex) => {
          const newIndex = (prevIndex + STOCKS_PER_VIEW) % ALL_STOCK_SYMBOLS.length;
          console.log('Cycling stocks, new index:', newIndex);
          return newIndex;
        });
      }, 10000);
      return () => clearInterval(cycleInterval);
    }
  }, [showStockWidget]);

  // Separate effect for fetching stock data
  useEffect(() => {
    if (showStockWidget) {
      const fetchInterval = setInterval(generateStockPrices, 30000);
      return () => clearInterval(fetchInterval);
    }
  }, [showStockWidget]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateRandomWallpaper = () => {
    // Using Lorem Picsum for random images without an API key
    setBackgroundUrl(`https://picsum.photos/1920/1080?random=${Math.random()}`);
  };

  const generateStockPrices = async () => {
    try {
      const currentSymbols = ALL_STOCK_SYMBOLS.slice(stockIndex, stockIndex + STOCKS_PER_VIEW);
      const stocks = await Promise.all(
        currentSymbols.map(async (symbol) => {
          // Check cache first
          if (stockDataRef.current[symbol] && 
              Date.now() - stockDataRef.current[symbol].timestamp < 30000) {
            return stockDataRef.current[symbol].data;
          }

          const response = await axios.get(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const data = response.data['Global Quote'];
          const stockData = {
            ticker: symbol,
            price: parseFloat(data['05. price']).toFixed(2),
            change: parseFloat(data['09. change']).toFixed(2),
            changePercent: data['10. change percent'].replace('%', '')
          };

          // Update cache
          stockDataRef.current[symbol] = {
            data: stockData,
            timestamp: Date.now()
          };

          return stockData;
        })
      );
      setCurrentStocks(stocks);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      // Fallback to mock data if API fails
      const currentSymbols = ALL_STOCK_SYMBOLS.slice(stockIndex, stockIndex + STOCKS_PER_VIEW);
      const mockStocks = currentSymbols.map(ticker => ({
        ticker: ticker,
        price: (Math.random() * (500 - 100) + 100).toFixed(2),
        change: (Math.random() * (10 - (-5)) + (-5)).toFixed(2),
        changePercent: (Math.random() * (5 - (-2)) + (-2)).toFixed(2)
      }));
      setCurrentStocks(mockStocks);
    }
  };

  // Effect to update displayed stocks when index changes
  useEffect(() => {
    if (showStockWidget) {
      const currentSymbols = ALL_STOCK_SYMBOLS.slice(stockIndex, stockIndex + STOCKS_PER_VIEW);
      const stocks = currentSymbols.map(symbol => {
        if (stockDataRef.current[symbol]) {
          return stockDataRef.current[symbol].data;
        }
        // If no cached data, fetch it immediately
        generateStockPrices();
        return {
          ticker: symbol,
          price: '...',
          change: '0.00',
          changePercent: '0.00'
        };
      });
      setCurrentStocks(stocks);
    }
  }, [stockIndex, showStockWidget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      text: inputMessage,
      sender: 'user',
      avatar: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        process.env.REACT_APP_API_URL || 'http://localhost:8000/chat',
        { 
          message: inputMessage,
          context: isStockMode ? "stock" : "general"
        }
      );

      const aiMessage = { 
        text: response.data.response, 
        sender: 'ai', 
        avatar: defaultAvatar 
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { 
        text: 'Sorry, I encountered an error. Please try again.', 
        sender: 'ai', 
        avatar: defaultAvatar 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Close stock widget when opening chat
      setShowStockWidget(false);
    }
  };

  const toggleStockWidget = () => {
    setShowStockWidget(!showStockWidget);
    if (!showStockWidget) {
      // Fetch initial data when showing the widget
      generateStockPrices();
    }
  };

  const toggleMode = () => {
    setIsStockMode(!isStockMode);
    setShowStockWidget(false);
    setMessages([{
      text: !isStockMode 
        ? 'Welcome to Stock Market Advisor! I can help you with stock analysis, market trends, and investment strategies. What would you like to know?'
        : 'Welcome to General AI Assistant! I can help you with any questions you have. What would you like to know?',
      sender: 'ai',
      avatar: defaultAvatar
    }]);
    welcomeShown.current = true;
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="App" style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: isOpen ? '0' : '10vh',
        backgroundColor: 'rgb(52, 53, 65)',
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <header className="App-header">
          <h1 style={{
            color: 'rgb(236, 236, 241)',
            marginBottom: '2rem',
            textAlign: 'center',
            fontSize: '3.5rem',
            fontWeight: 'bold',
            opacity: backgroundUrl ? '0.6' : '1',
            transition: 'opacity 0.3s ease-in-out',
            display: isOpen ? 'none' : 'block',
          }}>
            AI/Stock Assistant
          </h1>
        </header>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            backgroundColor: 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '280px',
            height: '280px',
            cursor: 'pointer',
            boxShadow: 'none',
            display: isOpen ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '0.5rem',
            padding: 0,
            opacity: backgroundUrl ? '0.3' : '1',
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          <img
            src={defaultAvatar}
            alt="Chat"
            style={{ 
              width: '180px', 
              height: '180px',
              objectFit: 'cover',
              clipPath: 'circle(50% at 50% 50%)'
            }}
          />
          <span style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '1.4rem',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            (FineTuned Chatbot V1)
          </span>
        </button>

        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: isOpen ? 'none' : 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
          zIndex: '1000',
          padding: '20px',
        }}>
          <button
            onClick={backgroundUrl ? () => setBackgroundUrl(null) : generateRandomWallpaper}
            style={{
              backgroundColor: backgroundUrl ? 'rgba(0, 0, 0, 0.7)' : 'transparent',
              color: 'white',
              border: backgroundUrl ? '1px solid rgba(0, 0, 0, 0.7)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: 'none',
              minWidth: '200px',
              textAlign: 'center',
              transition: 'all 0.3s ease-in-out',
              opacity: backgroundUrl ? '0.3' : '1',
            }}
          >
            {backgroundUrl ? 'Hide Random Wallpaper' : 'Generate Random Wallpaper'}
          </button>
          <button
            onClick={toggleStockWidget}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '5px',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: 'none',
              minWidth: '200px',
              textAlign: 'center',
              opacity: backgroundUrl ? '0.3' : '1',
            }}
          >
            {showStockWidget ? 'Hide Stock Updates' : 'Show Stock Updates'}
          </button>
          <div style={{
            backgroundColor: 'transparent',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '1.2rem',
            opacity: '1',
            transition: 'none',
            fontWeight: '500'
          }}>
            By: Rahul Kaura
          </div>
        </div>

        {isOpen && (
          <Paper
            elevation={3}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'rgb(52, 53, 65)',
              borderRadius: '0',
              overflow: 'hidden',
              zIndex: 1000
            }}
          >
            <div className="chat-container" style={{
              display: isOpen ? 'flex' : 'none',
              flexDirection: 'column',
              height: '100vh',
              backgroundColor: 'rgb(52, 53, 65)',
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
            }}>
              <div className="chat-header" style={{
                padding: '1rem',
                backgroundColor: 'rgb(64, 65, 79)',
                borderBottom: '1px solid rgb(86, 88, 105)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, color: 'white' }}>{isStockMode ? 'Stock Assistant' : 'AI Assistant'}</h2>
                  <Typography variant="body2" style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                    backgroundColor: isStockMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                  onClick={toggleMode}>
                    {isStockMode ? 'Stock Market Mode' : 'General AI Mode'}
                  </Typography>
                  {isLoading && (
                    <Typography variant="body2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      AI is typing...
                    </Typography>
                  )}
                </div>
                <IconButton onClick={() => setIsOpen(false)} size="small">
                  <CloseIcon style={{ color: 'white' }} />
                </IconButton>
              </div>

              <List
                style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: '10px',
                  backgroundColor: 'rgb(52, 53, 65)',
                }}
              >
                {messages.map((message, index) => (
                  <ListItem
                    key={index}
                    style={{
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      padding: '8px',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar src={message.avatar} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={message.text}
                      style={{
                        backgroundColor: message.sender === 'user' ? 'rgb(64, 65, 79)' : 'rgb(68, 70, 84)',
                        padding: '10px',
                        borderRadius: '10px',
                        maxWidth: '80%',
                        margin: message.sender === 'user' ? '0 10px 0 0' : '0 0 0 10px',
                      }}
                    />
                  </ListItem>
                ))}
                <div ref={messagesEndRef} />
              </List>

              <Box
                component="form"
                onSubmit={handleSubmit}
                style={{
                  padding: '10px',
                  backgroundColor: 'rgb(64, 65, 79)',
                  display: 'flex',
                  gap: '10px',
                }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Type your message..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  style={{
                    backgroundColor: 'rgb(52, 53, 65)',
                    borderRadius: '5px',
                  }}
                  InputProps={{
                    style: { color: 'white' },
                  }}
                />
                <IconButton
                  type="submit"
                  color="primary"
                  disabled={isLoading || !inputMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </div>
          </Paper>
        )}
        {showStockWidget && !isOpen && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(52, 53, 65, 0.9)',
            padding: '15px',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '250px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 10px 0', 
              color: 'white',
              fontSize: '1.1rem',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              paddingBottom: '5px'
            }}>
              Live Stock Updates
            </h3>
            {currentStocks.map((stock) => (
              <div key={stock.ticker} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '5px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>{stock.ticker}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'white' }}>${stock.price}</div>
                  <div style={{ 
                    color: parseFloat(stock.change) >= 0 ? '#4CAF50' : '#f44336',
                    fontSize: '0.9rem'
                  }}>
                    {parseFloat(stock.change) >= 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <style jsx>{`
          .rcw-widget-container {
            background-color: rgb(52, 53, 65) !important;
            box-shadow: -2px 0 10px rgba(0, 0, 0, 0.2) !important;
            border-radius: 0 !important;
            height: 100vh !important;
            width: 400px !important;
            right: 0 !important;
            left: auto !important;
          }
          .rcw-conversation-container {
            background-color: rgb(52, 53, 65) !important;
          }
          .rcw-header {
            background-color: rgb(52, 53, 65) !important;
            padding: 15px !important;
          }
          .rcw-title {
            color: white !important;
          }
          .rcw-subtitle {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          .rcw-message {
            margin: 10px 0 !important;
          }
          .rcw-client {
            background-color: #4CAF50 !important;
            color: white !important;
          }
          .rcw-response {
            background-color: rgb(68, 70, 84) !important;
            color: white !important;
          }
          .rcw-sender {
            color: rgba(255, 255, 255, 0.7) !important;
          }
          .rcw-new-message {
            background-color: rgb(52, 53, 65) !important;
            border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .rcw-input {
            background-color: rgb(68, 70, 84) !important;
            color: white !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
          }
          .rcw-send-button {
            background-color: #4CAF50 !important;
          }
          .rcw-close-button {
            color: white !important;
          }
        `}</style>
      </div>
    </ThemeProvider>
  );
}

export default App;