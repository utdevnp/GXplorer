# GXplorer

GXplorer is a modern, interactive visual interface for exploring, querying, and analyzing Gremlin-compatible graph databases—especially Azure Cosmos DB Gremlin API. With GXplorer, you and your team can connect, visualize, and understand your graph data with ease.

---

## Story Behind Creating GXplorer

While working with graph databases—specifically Gremlin on Azure Cosmos DB—I searched for a robust, user-friendly graph viewer. I tried several tools, but none met my expectations: some were paid, some incomplete, and others had confusing interfaces. Frustrated by the lack of a suitable solution, I decided to build my own graph viewer.

GXplorer was born out of this need. It now empowers my team to explore and analyze graph data efficiently, right from our own system.

---

## Features

- **Connect to Gremlin Servers**: Easily connect to any Gremlin-compatible graph database, including Azure Cosmos DB.
- **Visual Query Editor**: Write and run Gremlin queries with a modern editor and see results instantly.
- **Graph Visualization**: Interactive, dynamic visualization of your graph data—explore nodes and edges visually.
- **Schema Exploration**: View and manage vertex and edge labels directly from the UI.
- **Element Inspector**: Click on any node or edge to view its full JSON data in a dedicated details panel.
- **Tabbed Results**: Switch between query results, schema, and element details with a clean tabbed interface.
- **Query History**: Quickly access and rerun previous queries.
- **Export Options**: Export your graph as PNG or JSON for sharing or offline analysis.
- **User-Friendly Interface**: Built with Material-UI for a clean, modern look and smooth user experience.

---

## Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **Yarn** or **npm**
- Access credentials for your Gremlin-compatible graph database (e.g., Azure Cosmos DB Gremlin API)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/utdevnp/gxplorer.git
   cd gxplorer
   ```

2. **Install dependencies:**
   ```bash
   yarn install
   # or
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env.local` file in the root directory.
   - Add your Cosmos DB Gremlin credentials (if using Azure):
     ```
     COSMOSDB_GREMLIN_KEY=your-key
     COSMOSDB_DATABASE=your-database
     COSMOSDB_COLLECTION=your-collection
     ```

4. **Run the development server:**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000) in your browser to use GXplorer.**

---

## How to Use

- **Connect**: Enter your Gremlin server URL and credentials to connect.
- **Explore Schema**: Fetch and view available vertex and edge labels.
- **Query**: Write Gremlin queries in the editor and view results in both raw JSON and graph form.
- **Inspect**: Click any node or edge in the graph to see its full details in the "Node Data" tab.
- **Export**: Download your graph as PNG or JSON for further analysis or sharing.

---

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## About

GXplorer was created to fill the gap in Gremlin graph database visualization tools—especially for Azure Cosmos DB. It’s now an essential tool for my team, and I hope it helps others working with graph data as well.
