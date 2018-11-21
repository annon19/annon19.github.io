import * as React from "react";

interface NoResultProps {
  chart: string;
}

export const NoResult: React.StatelessComponent<NoResultProps>  = (p) => {
  return <p className="no-result">{`no matching result for ${p.chart}`}</p>;
};