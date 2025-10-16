// Obsługa rysowania na canvas

class CanvasController {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.shapeManager = new ShapeManager();
        this.isDrawing = false;
        this.drawingPath = [];
        this.selectedColor = '#000000';
        this.enabled = false;
        this.freehandMode = true; // Rysowanie ręczne jak mazakiem
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
    }

    handleMouseDown(e) {
        if (!this.enabled) return;
        
        this.isDrawing = true;
        this.drawingPath = [];
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.drawingPath.push({ x, y });
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.drawingPath.push({ x, y });
        
        // Rysuj ścieżkę na bieżąco
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        if (this.drawingPath.length > 1) {
            const prev = this.drawingPath[this.drawingPath.length - 2];
            this.ctx.beginPath();
            this.ctx.moveTo(prev.x, prev.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    handleMouseUp(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.drawingPath.length > 0) {
            // Stwórz obiekt ścieżki
            const pathShape = new Shape('path', 0, 0, {
                points: this.drawingPath,
                color: this.selectedColor,
                lineWidth: 3
            });
            this.shapeManager.addShape(pathShape);
            
            // Callback dla gry
            if (this.onShapeCreated) {
                this.onShapeCreated(pathShape);
            }
        }
        
        this.drawingPath = [];
    }

    drawPreview(currentX, currentY) {
        this.ctx.save();
        this.ctx.strokeStyle = this.selectedColor;
        this.ctx.fillStyle = this.selectedColor;
        this.ctx.globalAlpha = 0.5;
        this.ctx.setLineDash([5, 5]);
        
        const centerX = (this.startX + currentX) / 2;
        const centerY = (this.startY + currentY) / 2;
        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        
        switch(this.selectedShape) {
            case 'circle':
                const radius = Math.sqrt(width*width + height*height) / 2;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.stroke();
                break;
            case 'rectangle':
                this.ctx.strokeRect(this.startX, this.startY, width * Math.sign(currentX - this.startX), 
                                   height * Math.sign(currentY - this.startY));
                break;
            case 'line':
                this.ctx.beginPath();
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(currentX, currentY);
                this.ctx.stroke();
                break;
        }
        
        this.ctx.restore();
    }

    createShape(endX, endY) {
        const centerX = (this.startX + endX) / 2;
        const centerY = (this.startY + endY) / 2;
        const width = Math.abs(endX - this.startX);
        const height = Math.abs(endY - this.startY);
        
        let properties = {
            color: this.selectedColor,
            filled: true,
            opacity: 1
        };
        
        switch(this.selectedShape) {
            case 'circle':
                properties.radius = Math.sqrt(width*width + height*height) / 2;
                break;
            case 'rectangle':
                properties.width = width;
                properties.height = height;
                break;
            case 'line':
                properties.length = Math.sqrt(width*width + height*height);
                properties.rotation = Math.atan2(endY - this.startY, endX - this.startX) * 180 / Math.PI;
                properties.filled = false;
                break;
            case 'triangle':
                properties.size = Math.max(width, height);
                break;
            case 'ellipse':
                properties.radiusX = width / 2;
                properties.radiusY = height / 2;
                break;
        }
        
        const shape = new Shape(this.selectedShape, centerX, centerY, properties);
        this.shapeManager.addShape(shape);
        this.redraw();
        
        // Callback dla gry
        if (this.onShapeCreated) {
            this.onShapeCreated(shape);
        }
    }

    addAIShape(shapeData) {
        const shape = new Shape(
            shapeData.type,
            shapeData.x,
            shapeData.y,
            shapeData.properties
        );
        this.shapeManager.addShape(shape);
        this.redraw();
    }
    
    addAIStroke(strokeData) {
        // Dodaj kreskę od AI (jak użytkownik rysuje mazakiem)
        const stroke = new Shape('path', 0, 0, {
            points: strokeData.points,
            color: strokeData.color,
            lineWidth: strokeData.thickness || 2
        });
        this.shapeManager.addShape(stroke);
        this.redraw();
    }

    redraw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shapeManager.drawAll(this.ctx);
    }

    clear() {
        this.shapeManager.clear();
        this.redraw();
    }

    setSelectedShape(shape) {
        this.selectedShape = shape;
    }

    setColor(color) {
        this.selectedColor = color;
    }

    enable() {
        this.enabled = true;
        this.canvas.style.cursor = 'crosshair';
    }

    disable() {
        this.enabled = false;
        this.canvas.style.cursor = 'default';
    }

    getCanvasState() {
        return this.shapeManager.toJSON();
    }
}

