import * as React from "react";
import ScrubberView from "./ScrubberView";
import Walkthrough from "./Walkthrough";

export const PageContainer = () => (<>
  <h2>
    Crossfilter Implemented in DIEL
  </h2>
  <p>
    The top visualization is a straight forward adaptation of the crossfilter of the flights dataset. The bottom is a design shows a history of past interaction result that are all asycnhronously rendered.
  </p>
  <p>
    All the interactions, including navigating the small thumbnails are implemented in DIEL. The DIEL part of the source code can be found <a href="https://github.com/annon19/annon19.github.io">here</a>. It also makes use of another database running in a WebWorker.
    The latency is instrumented to demonstrate how the interface deal with the asynchorny.
    The rest are standard UI set up (React with D3).
  </p>
  <p>
    We provide a basic walk through of some DIEL queries used to specify this interactive visualization.
  </p>
  <ScrubberView
    showIntro={false}
  />
  <Walkthrough/>
</>);