// Import document loaders for different file formats
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { JSONLoader } from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { DocxLoader } from "langchain/document_loaders/fs/docx";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "langchain/chains/combine_documents";

// Import OpenAI language model and other related modules
import { OpenAI } from "@langchain/openai";
import { RetrievalQAChain } from "langchain/chains";
import { HNSWLib } from "@langchain/community/vectorstores/hnswlib";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Import dotenv for loading environment variables and fs for file system operations
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// Initialize the document loader with supported file formats
const loader = new DirectoryLoader("./data", {
  ".json": (path) => new JSONLoader(path),
  ".txt": (path) => new TextLoader(path),
  ".csv": (path) => new CSVLoader(path),
  ".pdf": (path) => new PDFLoader(path),
  ".docx": (path) => new DocxLoader(path),
});

//  Load documents from the specified directory
console.log("Loading docs...");
const docs = await loader.load();
console.log("Docs loaded.");

const VECTOR_STORE_PATH = "Data.index";

// Define a function to normalize the content of the documents
function normalizeDocuments(docs) {
  return docs.map((doc) => {
    if (typeof doc.pageContent === "string") {
      return doc.pageContent;
    } else if (Array.isArray(doc.pageContent)) {
      return doc.pageContent.join("\n");
    }
  });
}

// Define the main function to run the entire process
const runEmbeddings = async (userData) => {
  try {
    let vectorStore;

    // Check if an existing vector store is available
    console.log("Checking for existing vector store...");
    if (fs.existsSync(VECTOR_STORE_PATH)) {
      //  Load the existing vector store
      console.log("Loading existing vector store...");
      vectorStore = await HNSWLib.load(
        VECTOR_STORE_PATH,
        new OpenAIEmbeddings()
      );
      console.log("Vector store loaded.");
    } else {
      //  Create a new vector store if one does not exist
      console.log("Creating new vector store...");
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
      });
      const normalizedDocs = normalizeDocuments(docs);
      const splitDocs = await textSplitter.createDocuments(normalizedDocs);

      //  Generate the vector store from the documents
      vectorStore = await HNSWLib.fromDocuments(
        splitDocs,
        new OpenAIEmbeddings()
      );
      //  Save the vector store to the specified path
      await vectorStore.save(VECTOR_STORE_PATH);

      console.log("Vector store created.");
    }
    const retriever = vectorStore.asRetriever({
      k: 6,
      searchType: "similarity",
    });
    const template = `
    You are a career counseling assistant named Nexa, specializing in personalized advice for students in Pakistan. Your goal is to help users make informed decisions about their future career paths based on their age, gender, educational background, interests, goals, strengths, weaknesses, and financial situation. Use the information provided by the user and the context to categorize them into one of the target audiences and provide tailored advice.
    
    
    Response Format:
        - Start your response with Dear, considering your current situation, I suggest you these [field name], [field name], [field name] career paths. You have the option to do  [degree/program name] in these fields from [Uni Name/Institute Name] or [Uni Name/Institute Name].
Use the following  context to answer the question and provide helpful advice to the user.

    {context}
    
    Question: {question}
    
    Helpful Answer:`;

    const customRagPrompt = PromptTemplate.fromTemplate(template);
    const llm = new ChatOpenAI({
      model: "gpt-3.5-turbo-16k",
      temperature: 0,
    });
    const ragChain = await createStuffDocumentsChain({
      llm,
      prompt: customRagPrompt,
      outputParser: new StringOutputParser(),
    });
    const context = await retriever.getRelevantDocuments(userData);

    const res = await ragChain.invoke({
      question: userData,
      context,
    });
    return res;
  } catch (error) {
    console.error(error);
  }
};

// const userData =
//   "Suppose I have 85% in my matriculation in science subjects, which colleges I can opt in Karachi?";

//runEmbeddings(userData);

export default runEmbeddings;
