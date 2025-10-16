// System zarządzania kształtami

class Shape {
    constructor(type, x, y, properties) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.properties = properties;
        this.id = Date.now() + Math.random();
    }

    draw(ctx) {
        ctx.save();
        
        if (this.type === 'path') {
            // Rysowanie ścieżki ręcznej
            this.drawPath(ctx);
        } else {
            ctx.translate(this.x, this.y);
            
            if (this.properties.rotation) {
                ctx.rotate(this.properties.rotation * Math.PI / 180);
            }
            
            ctx.fillStyle = this.properties.color || '#000000';
            ctx.strokeStyle = this.properties.strokeColor || this.properties.color || '#000000';
            ctx.lineWidth = this.properties.lineWidth || 2;
            ctx.globalAlpha = this.properties.opacity || 1;

            switch(this.type) {
                case 'circle':
                    this.drawCircle(ctx);
                    break;
                case 'rectangle':
                    this.drawRectangle(ctx);
                    break;
                case 'line':
                    this.drawLine(ctx);
                    break;
                case 'triangle':
                    this.drawTriangle(ctx);
                    break;
                case 'ellipse':
                    this.drawEllipse(ctx);
                    break;
            }
        }
        
        ctx.restore();
    }
    
    drawPath(ctx) {
        if (!this.properties.points || this.properties.points.length < 2) return;
        
        ctx.strokeStyle = this.properties.color || '#000000';
        ctx.lineWidth = this.properties.lineWidth || 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = this.properties.opacity || 1;
        
        ctx.beginPath();
        ctx.moveTo(this.properties.points[0].x, this.properties.points[0].y);
        
        for (let i = 1; i < this.properties.points.length; i++) {
            ctx.lineTo(this.properties.points[i].x, this.properties.points[i].y);
        }
        
        ctx.stroke();
    }

    drawCircle(ctx) {
        ctx.beginPath();
        ctx.arc(0, 0, this.properties.radius || 30, 0, Math.PI * 2);
        if (this.properties.filled !== false) {
            ctx.fill();
        }
        ctx.stroke();
    }

    drawRectangle(ctx) {
        const w = this.properties.width || 60;
        const h = this.properties.height || 40;
        ctx.beginPath();
        ctx.rect(-w/2, -h/2, w, h);
        if (this.properties.filled !== false) {
            ctx.fill();
        }
        ctx.stroke();
    }

    drawLine(ctx) {
        const length = this.properties.length || 50;
        ctx.beginPath();
        ctx.moveTo(-length/2, 0);
        ctx.lineTo(length/2, 0);
        ctx.stroke();
    }

    drawTriangle(ctx) {
        const size = this.properties.size || 50;
        ctx.beginPath();
        ctx.moveTo(0, -size/2);
        ctx.lineTo(-size/2, size/2);
        ctx.lineTo(size/2, size/2);
        ctx.closePath();
        if (this.properties.filled !== false) {
            ctx.fill();
        }
        ctx.stroke();
    }

    drawEllipse(ctx) {
        const rx = this.properties.radiusX || 50;
        const ry = this.properties.radiusY || 30;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        if (this.properties.filled !== false) {
            ctx.fill();
        }
        ctx.stroke();
    }

    toJSON() {
        return {
            type: this.type,
            x: this.x,
            y: this.y,
            properties: this.properties
        };
    }
}

class ShapeManager {
    constructor() {
        this.shapes = [];
    }

    addShape(shape) {
        this.shapes.push(shape);
    }

    removeShape(shape) {
        const index = this.shapes.indexOf(shape);
        if (index > -1) {
            this.shapes.splice(index, 1);
        }
    }

    clear() {
        this.shapes = [];
    }

    getAllShapes() {
        return this.shapes;
    }

    getLastShape() {
        return this.shapes[this.shapes.length - 1];
    }

    drawAll(ctx) {
        this.shapes.forEach(shape => shape.draw(ctx));
    }

    toJSON() {
        return this.shapes.map(s => s.toJSON());
    }
}

