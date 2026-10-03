import { test, expect, render, screen, within, user, waitFor } from "./testing.js";
import { settings, resetServer, whenIdle } from "./fakeServer.js";
import Bookmarks from "./Bookmarks";

// Your user-action tests: loading, adding, a failed favorite and removing.
