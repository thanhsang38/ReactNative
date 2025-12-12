import axios, { AxiosInstance, AxiosResponse } from "axios";

export interface CustomAxiosInstance extends AxiosInstance {
  get: <T = any, R = T>(url: string, config?: any) => Promise<R>;
  post: <T = any, R = T>(url: string, data?: any, config?: any) => Promise<R>;
  put: <T = any, R = T>(url: string, data?: any, config?: any) => Promise<R>;
  delete: <T = any, R = T>(url: string, config?: any) => Promise<R>;
}

const BASEROW_BASE_URL = "https://api.baserow.io/api/database/rows/table/";
const API_TOKEN = "78WCfXpbSExuHx3YTJ2CfO2rnMSSCosd";

const axiosClient: CustomAxiosInstance = axios.create({
  baseURL: BASEROW_BASE_URL,
  headers: {
    Authorization: `Token ${API_TOKEN}`,
    "Content-Type": "application/json",
  },
}) as CustomAxiosInstance;

// ----------- LOG REQUEST -------------
axiosClient.interceptors.request.use((config) => {
  console.log("🚀 [REQUEST]", {
    url: config.url,
    method: config.method,
    params: config.params,
    data: config.data,
  });
  return config;
});

// ----------- LOG RESPONSE -------------
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // console.log("📥 [RESPONSE]", {
    //   url: response.config.url,
    //   status: response.status,
    //   data: response.data,
    // });
    return response.data;
  },
  (error) => {
    console.log("❌ [AXIOS ERROR]", {
      url: error?.config?.url,
      message: error.message,
      response: error.response?.data,
    });
    return Promise.reject(error);
  }
);

export default axiosClient;
