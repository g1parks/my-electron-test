import { GCanvasDelegator } from './GCanvasDelegator.js';

class Node {
    constructor(name) {
        this.name = name;
        this.incomingLinks = [];
        this.outgoingLinks = [];
        this.value = 0;
    }

    addIncomingLink(link) {
        this.incomingLinks.push(link);
    }

    addOutgoingLink(link) {
        this.outgoingLinks.push(link);
    }
}

export class GSankeyDiagram {
    constructor() {
        this.canvasDelegator = new GCanvasDelegator();
        this.nodes = {};
    }

    calculateDepths(data) {
        const depths = {};
        data.forEach(link => {
            if (!this.nodes[link.from]) this.nodes[link.from] = new Node(link.from);
            if (!this.nodes[link.to]) this.nodes[link.to] = new Node(link.to);

            this.nodes[link.from].addOutgoingLink(link);
            this.nodes[link.to].addIncomingLink(link);

            if (!depths[link.from]) depths[link.from] = 0;
            if (!depths[link.to]) depths[link.to] = depths[link.from] + 1;
            else depths[link.to] = Math.max(depths[link.to], depths[link.from] + 1);
        });
        return depths;
    }

    organizeNodesByDepth(depths) {
        const nodesByDepth = {};
        for (const node in depths) {
            const depth = depths[node];
            if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
            nodesByDepth[depth].push(this.nodes[node]);
        }
        return nodesByDepth;
    }

    calculateTotalIncomingByDepth(nodesByDepth) {
        const totalIncomingByDepth = {};
        for (const depth in nodesByDepth) {
            totalIncomingByDepth[depth] = nodesByDepth[depth].reduce((sum, node) => {
                return sum + node.incomingLinks.reduce((linkSum, link) => linkSum + link.value, 0);
            }, 0);
        }
        return totalIncomingByDepth;
    }

    drawSankey(data, options) {
		const { width, height, containerId } = options;
		this.canvasDelegator.initCanvas(width, height, containerId);

		const ctx = this.canvasDelegator.getCanvasContext();
		if (!ctx) return;

		const NODE_UPSIDE_MARGIN = 10;
		const NODE_DOWNSIDE_MARGIN = 10;
		const MIN_THICKNESS = 1; // 최소 두께를 1픽셀로 설정

		ctx.save();
		ctx.scale(this.canvasDelegator.dpr, this.canvasDelegator.dpr);

		const depths = this.calculateDepths(data);
		const nodesByDepth = this.organizeNodesByDepth(depths);
		const totalIncomingByDepth = this.calculateTotalIncomingByDepth(nodesByDepth);

		const maxTotalIncoming = Math.max(...Object.values(totalIncomingByDepth));
		const maxDepth = Object.keys(nodesByDepth).reduce((max, key) => Math.max(max, nodesByDepth[key].length), 0);
		const availableHeight = height - (maxDepth * (NODE_UPSIDE_MARGIN + NODE_DOWNSIDE_MARGIN));
		
		const links = [];
		const nodePadding = 10;
		const nodeWidth = 50; // 노드의 가로폭을 기존의 3분의 1로 설정
		const depthCount = Math.max(...Object.values(depths)) + 1;
		const adjustedDepthSpacing = (width - nodeWidth * depthCount) / (depthCount - 1);

		// 노드별로 색상 설정
		const nodeColors = {};
		for (const key in this.nodes) {
			nodeColors[key] = this.getRandomPastelColor();
		}

		// 깊이에 따라 노드의 위치와 크기를 계산합니다.
		Object.keys(nodesByDepth).forEach(depth => {
			let yOffset = NODE_UPSIDE_MARGIN;
			nodesByDepth[depth].forEach(node => {
				node.x = depth * (nodeWidth + adjustedDepthSpacing);
				node.y = yOffset;
				const depthTotalIncoming = totalIncomingByDepth[depth];
				const nodeHeight = availableHeight * (depthTotalIncoming / maxTotalIncoming) / nodesByDepth[depth].length;
				node.nodeHeight = nodeHeight;
				node.currentOutgoingYOffset = node.y; // 노드의 현재 아웃고잉 y 오프셋 초기화
				node.currentYOffset = yOffset; // 현재 yOffset을 추적
				yOffset += nodeHeight + NODE_UPSIDE_MARGIN + NODE_DOWNSIDE_MARGIN;
			});
		});

		// 링크를 생성합니다.
		data.forEach(link => {
			const fromNode = this.nodes[link.from];
			const toNode = this.nodes[link.to];
			toNode.value += link.value;

			// 두께 계산
			let fromThickness = fromNode.nodeHeight / fromNode.outgoingLinks.reduce((sum, l) => sum + l.value, 0) * link.value;
			let toThickness = toNode.nodeHeight / toNode.incomingLinks.reduce((sum, l) => sum + l.value, 0) * link.value;

			// fromThickness가 부모 노드의 높이를 초과하지 않도록 설정
			if (fromThickness > fromNode.nodeHeight) {
				fromThickness = fromNode.nodeHeight;
			}

			// fromThickness가 너무 작으면 최소 두께로 설정
			if (isNaN(fromThickness) || fromThickness < MIN_THICKNESS) {
				fromThickness = MIN_THICKNESS;
			}

			// toThickness가 너무 작으면 최소 두께로 설정
			if (isNaN(toThickness) || toThickness < MIN_THICKNESS) {
				toThickness = MIN_THICKNESS;
			}

			// 링크 시작과 끝의 y 좌표 계산
			const fromY = fromNode.currentOutgoingYOffset + fromThickness / 2;
			fromNode.currentOutgoingYOffset += fromThickness;

			const toY = toNode.currentYOffset + toThickness / 2;
			toNode.currentYOffset += toThickness;

			links.push({
				from: fromNode,
				to: toNode,
				value: link.value,
				fromThickness,
				toThickness,
				fromY,
				toY,
				color: this.convertToRGBA(nodeColors[link.to], 0.9) // toNode의 색상을 링크의 색상으로 설정, 투명도 추가
			});
		});

		// 노드를 그립니다.
		for (const key in this.nodes) {
			const node = this.nodes[key];
			ctx.fillStyle = nodeColors[key]; // 노드 색상을 파스텔톤으로 설정
			ctx.fillRect(node.x, node.y, nodeWidth, node.nodeHeight);
		}

		// 링크를 그립니다.
		links.forEach(link => {
			const fromNode = link.from;
			const toNode = link.to;
			const fromX = fromNode.x + nodeWidth;
			const toX = toNode.x;

			// drawComplexShape 함수로 링크를 그립니다.
			this.canvasDelegator.drawComplexShape(
				fromX, link.fromY - link.fromThickness / 2,
				toX, link.toY - link.toThickness / 2,
				fromX, link.fromY + link.fromThickness / 2,
				toX, link.toY + link.toThickness / 2,
				link.color, link.color // 링크의 색상을 toNode의 색상으로 설정
			);
		});

		// 노드의 값을 그립니다.
		ctx.font = "14px Arial";
		ctx.textAlign = "right";
		ctx.textBaseline = "middle";
		for (const key in this.nodes) {
			const node = this.nodes[key];
			ctx.fillStyle = "#000";
			ctx.fillText(`${node.value}`, node.x - 5, node.y + node.nodeHeight / 2);
		}

		// 노드의 이름을 그립니다.
		ctx.textAlign = "left";
		for (const key in this.nodes) {
			const node = this.nodes[key];
			ctx.fillStyle = "#000";
			ctx.fillText(`${node.name}`, node.x + 5, node.y + node.nodeHeight / 2);
		}

		ctx.restore();
	}
									


	getRandomPastelColor() {
		const r = Math.floor(Math.random() * 127 + 127); // 127~254
		const g = Math.floor(Math.random() * 127 + 127); // 127~254
		const b = Math.floor(Math.random() * 127 + 127); // 127~254
		return `rgb(${r},${g},${b})`;
	}
	
	convertToRGBA(rgb, alpha) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);
    return `rgba(${r},${g},${b},${alpha})`;
}






}
