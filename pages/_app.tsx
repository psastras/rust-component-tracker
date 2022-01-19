import type { AppProps } from "next/app";
import {
  ThemeProvider, // NOTE: Use Fabric instead in version 7 or earlier
  initializeIcons,
} from "@fluentui/react";

import "./styles.css";
initializeIcons();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

export default MyApp;
