const LineShadow = () => (
  <defs>
    <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow
        dx="0"
        dy="6"
        stdDeviation="6"
        floodColor="#036b80"
        floodOpacity="0.25"
      />
    </filter>
  </defs>
);

export default LineShadow;
