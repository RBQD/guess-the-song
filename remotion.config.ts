import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(100);
Config.setCodec("h264");
Config.setOverwriteOutput(true);
Config.setVideoBitrate("12M");
Config.setAudioBitrate("384k");
Config.setPixelFormat("yuv420p");
