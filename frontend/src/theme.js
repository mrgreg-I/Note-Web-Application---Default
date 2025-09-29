import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "Poppins, sans-serif",
  },
  palette: {
    background: {
      default: "white",
    },
    primary: {
      main: "#EC8305",
    },
    secondary: {
      main: "#091057",
    },
  },
});

export default theme;
