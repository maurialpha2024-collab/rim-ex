import { auth } from "./auth";
import { common } from "./common";
import { market } from "./market";
import { order } from "./order";
import { profile } from "./profile";
import { trade } from "./trade";
import { verify } from "./verify";

export const fr = {
  ...common,
  ...auth,
  ...market,
  ...order,
  ...trade,
  ...verify,
  ...profile,
};
