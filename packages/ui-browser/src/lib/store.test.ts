import { describe, expect, it, beforeEach } from "@jest/globals";
import type { ClientMessage } from "@quack/protocol";
import { useStore } from "./store";

const resetAsks = () => {
  useStore.setState({ asks: {}, askOrder: [], askModel: undefined });
};

const captureSends = (): ClientMessage[] => {
  const sent: ClientMessage[] = [];
  useStore.getState().setSend((msg) => sent.push(msg));
  return sent;
};

const askInput = {
  file: "src/foo.ts",
  fromLine: 1,
  toLine: 1,
  chunk: "const x = 1;",
  question: "why?",
};

describe("startAsk model override", () => {
  beforeEach(resetAsks);

  it("omits model when askModel is the session default (undefined)", () => {
    const sent = captureSends();
    useStore.getState().startAsk(askInput);
    expect(sent).toHaveLength(1);
    const msg = sent[0];
    expect(msg?.type).toBe("ask");
    expect(msg && "model" in msg).toBe(false);
  });

  it("attaches the selected model to the ask message and the stored ask", () => {
    const sent = captureSends();
    useStore.getState().setAskModel("haiku");
    const id = useStore.getState().startAsk(askInput);
    const msg = sent[0];
    expect(msg?.type === "ask" && msg.model).toBe("haiku");
    expect(useStore.getState().asks[id]?.model).toBe("haiku");
  });

  it("retries on the same model the ask was sent with", () => {
    const sent = captureSends();
    useStore.getState().setAskModel("sonnet");
    const id = useStore.getState().startAsk(askInput);
    // Simulate the ask failing so retry is allowed.
    useStore.getState().finishAsk(id, "error", "boom");
    useStore.getState().retryAsk(id);
    const retryMsg = sent[sent.length - 1];
    expect(retryMsg?.type === "ask" && retryMsg.model).toBe("sonnet");
  });
});

describe("setAskModel", () => {
  beforeEach(resetAsks);

  it("updates the active model and clears back to default", () => {
    useStore.getState().setAskModel("opus");
    expect(useStore.getState().askModel).toBe("opus");
    useStore.getState().setAskModel(undefined);
    expect(useStore.getState().askModel).toBeUndefined();
  });
});
