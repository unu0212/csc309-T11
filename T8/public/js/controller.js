/*
 * controller.js
 *
 * CSC309 Tutorial 8
 * 
 * Complete me
 */
document.addEventListener("DOMContentLoaded", () => {
    const dataContainer = document.getElementById("data");
    let currentParagraph = 1;
    let hasMoreData = true;
    
    const fetchParagraphs = async () => {
        if (!hasMoreData) return;
        
        try {
            const response = await fetch(`/text?paragraph=${currentParagraph}`);
            const result = await response.json();
            
            result.data.forEach(paragraph => {
                const paragraphDiv = document.createElement("div");
                paragraphDiv.id = `paragraph_${paragraph.id}`;
                
                const pElement = document.createElement("p");
                pElement.textContent = paragraph.content + " ";
                
                const boldElement = document.createElement("b");
                boldElement.textContent = "(Paragraph: )";
                pElement.appendChild(boldElement);
                
                const likeButton = document.createElement("button");
                likeButton.classList.add("btn", "like");
                likeButton.textContent = `Likes: ${paragraph.likes}`;
                likeButton.addEventListener("click", () => likeParagraph(paragraph.id, likeButton));
                
                paragraphDiv.appendChild(pElement);
                paragraphDiv.appendChild(likeButton);
                dataContainer.appendChild(paragraphDiv);
            });
            
            currentParagraph += result.data.length;
            hasMoreData = result.next;
            
            if (!hasMoreData) {
                const endMessage = document.createElement("b");
                endMessage.textContent = "You have reached the end";
                dataContainer.appendChild(endMessage);
            }
        } catch (error) {
            console.error("Error fetching paragraphs:", error);
        }
    };
    
    const likeParagraph = async (id, button) => {
        try {
            const response = await fetch("/text/like", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paragraph: id })
            });
            
            const result = await response.json();
            button.textContent = `Likes: ${result.data.likes}`;
        } catch (error) {
            console.error("Error updating likes:", error);
        }
    };
    
    const handleScroll = () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 10) {
            fetchParagraphs();
        }
    };
    
    window.addEventListener("scroll", handleScroll);
    fetchParagraphs();
});
